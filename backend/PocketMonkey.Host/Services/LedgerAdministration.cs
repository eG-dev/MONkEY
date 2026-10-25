using System.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Storage;

namespace PocketMonkey.Host.Services;

public sealed class LedgerAdministration
{
    private readonly PocketMonkeyDbContext database;
    private readonly InstanceSettings settings;
    private readonly TimeProvider time;

    public LedgerAdministration(PocketMonkeyDbContext database, InstanceSettings settings, TimeProvider? time = null)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.time = time ?? TimeProvider.System;
    }

    public Task<(LedgerEntryResponse? Entry, LedgerError? Error)> PostOpeningAsync(
        string accountId,
        OpeningBalanceRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        return PostAsync(accountId, request.Amount, LedgerEntrySource.Opening, request.Comment, request.IdempotencyKey, actor, cancellationToken);
    }

    public Task<(LedgerEntryResponse? Entry, LedgerError? Error)> PostTransactionAsync(
        string accountId,
        TransactionRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.Source is LedgerEntrySource.Deposit or LedgerEntrySource.Withdrawal
            ? PostAsync(accountId, request.Amount, request.Source, request.Comment, request.IdempotencyKey, actor, cancellationToken)
            : Task.FromResult<(LedgerEntryResponse?, LedgerError?)>((null, LedgerError.InvalidSource));
    }

    internal Task<(LedgerEntryResponse? Entry, LedgerError? Error)> PostAllowanceAsync(
        AllowanceExecution execution, long amount, DateTimeOffset now, CancellationToken cancellationToken)
    {
        return PostAsync(execution.AccountId, CurrencyAmount.Format(amount), LedgerEntrySource.Allowance, null,
            execution.IdempotencyKey, "system:monthly-allowance", cancellationToken, execution, now);
    }

    public async Task<(LedgerHistoryResponse? History, LedgerError? Error)> HistoryAsync(
        string accountId,
        int pageSize,
        string? cursor,
        CancellationToken cancellationToken)
    {
        if (pageSize is < 1 or > 100)
        {
            return (null, LedgerError.InvalidPageSize);
        }

        if (!await database.Accounts.AnyAsync(account => account.Id == accountId, cancellationToken))
        {
            return (null, LedgerError.NotFound);
        }

        LedgerHistoryCursor? continuation = null;

        if (cursor is not null)
        {
            if (cursor.Length > 512)
            {
                return (null, LedgerError.InvalidCursor);
            }

            try
            {
                continuation = JsonSerializer.Deserialize<LedgerHistoryCursor>(Convert.FromBase64String(cursor));
            }
            catch (Exception exception) when (exception is FormatException or JsonException)
            {
                return (null, LedgerError.InvalidCursor);
            }

            if (continuation is null || continuation.AccountId != accountId || continuation.Snapshot < 1 ||
                continuation.Before < 1 || continuation.Before > continuation.Snapshot)
            {
                return (null, LedgerError.InvalidCursor);
            }
        }

        await using var historyTransaction = await database.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        var revision = await database.LedgerMaintenanceStates.AsNoTracking()
            .Select(state => state.RetentionRevision).SingleAsync(cancellationToken);

        if (continuation is not null && continuation.RetentionRevision != revision)
        {
            return (null, LedgerError.HistoryRetentionChanged);
        }

        var entries = database.LedgerEntries.AsNoTracking().Where(entry => entry.AccountId == accountId);
        var snapshot = continuation?.Snapshot ?? await entries.MaxAsync(entry => (long?)entry.SequenceNumber, cancellationToken) ?? 0;
        entries = entries.Where(entry => entry.SequenceNumber <= snapshot);

        if (continuation is not null)
        {
            var before = continuation.Before;
            entries = entries.Where(entry => entry.SequenceNumber < before);
        }

        var page = await entries
            .OrderByDescending(entry => entry.SequenceNumber)
            .Take(pageSize + 1)
            .ToListAsync(cancellationToken);
        var visible = page.Take(pageSize).ToList();
        var nextCursor = page.Count > pageSize
            ? Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(new LedgerHistoryCursor
            {
                AccountId = accountId,
                RetentionRevision = revision,
                Snapshot = snapshot,
                Before = visible[^1].SequenceNumber
            }))
            : null;

        return (new LedgerHistoryResponse
        {
            Timezone = settings.Timezone,
            RetentionMonths = settings.TransactionRetentionMonths,
            RetentionCutoffUtc = TransactionRetention.Cutoff(time.GetUtcNow(), settings.TransactionRetentionMonths),
            Entries = visible.Select(entry => Describe(entry, settings.Currency)).ToList(),
            NextCursor = nextCursor
        }, null);
    }

    private async Task<(LedgerEntryResponse? Entry, LedgerError? Error)> PostAsync(
        string accountId,
        string amountInput,
        LedgerEntrySource source,
        string? commentInput,
        string idempotencyKey,
        string actor,
        CancellationToken cancellationToken,
        AllowanceExecution? execution = null,
        DateTimeOffset? occurredAtUtc = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        if (!CurrencyAmount.TryParse(amountInput, out var amount) || (source != LedgerEntrySource.Opening && amount <= 0))
        {
            return (null, LedgerError.InvalidAmount);
        }

        if (!Guid.TryParseExact(idempotencyKey, "D", out var requestId))
        {
            return (null, LedgerError.InvalidIdempotencyKey);
        }

        var comment = commentInput?.Trim();
        comment = string.IsNullOrEmpty(comment) ? null : comment;

        if (comment is { Length: > 500 })
        {
            return (null, LedgerError.InvalidComment);
        }

        var delta = source == LedgerEntrySource.Withdrawal ? -amount : amount;
        var key = requestId.ToString();

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        if (await database.RetiredLedgerKeys.AnyAsync(entry => entry.IdempotencyKey == key, cancellationToken))
        {
            return (null, LedgerError.TransactionHistoryExpired);
        }

        var existing = await database.LedgerEntries.SingleOrDefaultAsync(entry => entry.IdempotencyKey == key, cancellationToken);

        if (existing is not null)
        {
            return existing.AccountId == accountId && existing.ActorId == actor && existing.Source == source &&
                existing.AmountMinorUnits == delta && existing.Comment == comment
                ? (Describe(existing, settings.Currency), null)
                : (null, LedgerError.IdempotencyConflict);
        }

        var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == accountId, cancellationToken);

        if (account is null)
        {
            return (null, LedgerError.NotFound);
        }

        if (source == LedgerEntrySource.Opening && account.BalanceMinorUnits.HasValue)
        {
            return (null, LedgerError.AlreadyInitialized);
        }

        if (source != LedgerEntrySource.Opening && !account.BalanceMinorUnits.HasValue)
        {
            return (null, LedgerError.NotInitialized);
        }

        long balance;

        try
        {
            balance = checked((account.BalanceMinorUnits ?? 0) + delta);
        }
        catch (OverflowException)
        {
            return (null, LedgerError.BalanceOverflow);
        }

        var actorName = source == LedgerEntrySource.Allowance ? "POCKET MONkEY" : await database.Users
            .Where(user => user.Id == actor)
            .Select(user => user.DisplayName)
            .SingleAsync(cancellationToken);
        var maintenance = await database.LedgerMaintenanceStates.SingleAsync(cancellationToken);
        var sequence = checked(maintenance.LastAllocatedSequenceNumber + 1);
        maintenance.LastAllocatedSequenceNumber = sequence;
        var entry = new LedgerEntry
        {
            AccountId = accountId,
            AmountMinorUnits = delta,
            SequenceNumber = sequence,
            IdempotencyKey = key,
            ActorId = actor,
            ActorDisplayName = actorName,
            OccurredAtUtc = (occurredAtUtc ?? time.GetUtcNow()).ToUniversalTime(),
            Source = source,
            Comment = comment,
            AllowanceMonth = execution?.BusinessMonth
        };

        if (execution is not null)
        {
            execution.CreditedAtUtc = entry.OccurredAtUtc;
            execution.ErrorCode = null;
        }

        account.BalanceMinorUnits = balance;
        database.LedgerEntries.Add(entry);
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor,
            SubjectId = accountId,
            Action = source == LedgerEntrySource.Opening ? "opening_posted"
                : source == LedgerEntrySource.Allowance ? "allowance_posted" : "transaction_posted",
            OccurredAtUtc = entry.OccurredAtUtc
        });

        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return (Describe(entry, settings.Currency), null);
    }

    public static LedgerEntryResponse Describe(LedgerEntry entry, string currency) => new()
    {
        Id = entry.Id,
        AccountId = entry.AccountId,
        Amount = CurrencyAmount.Format(entry.AmountMinorUnits),
        Currency = currency,
        ActorId = entry.ActorId,
        ActorDisplayName = entry.ActorDisplayName,
        OccurredAtUtc = entry.OccurredAtUtc,
        Source = entry.Source,
        Comment = entry.Comment,
        AllowanceMonth = entry.AllowanceMonth is { } month ? $"{month / 100:D4}-{month % 100:D2}" : null
    };
}