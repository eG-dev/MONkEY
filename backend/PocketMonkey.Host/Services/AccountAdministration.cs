using System.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Storage;

namespace PocketMonkey.Host.Services;

public sealed class AccountAdministration
{
    private readonly PocketMonkeyDbContext database;
    private readonly InstanceSettings settings;
    private readonly TimeProvider clock;

    public AccountAdministration(PocketMonkeyDbContext database, InstanceSettings settings, TimeProvider? clock = null)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.clock = clock ?? TimeProvider.System;
    }

    public async Task<List<AccountResponse>> ListAsync(CancellationToken cancellationToken, string? memberId = null)
    {
        var accounts = await AccountReadAccess.Accounts(database, memberId)
            .AsNoTracking()
            .Where(account => account.RetiredAtUtc == null)
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .OrderBy(account => account.NormalizedName)
            .ThenBy(account => account.Id)
            .ToListAsync(cancellationToken);

        return accounts.Select(Describe).ToList();
    }

    public async Task<List<AccountResponse>> ListRetiredAsync(CancellationToken cancellationToken)
    {
        var accounts = await database.Accounts.AsNoTracking()
            .Where(account => account.RetiredAtUtc != null)
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .OrderBy(account => account.NormalizedName)
            .ThenBy(account => account.Id)
            .ToListAsync(cancellationToken);

        return accounts.Select(Describe).ToList();
    }

    public async Task<AccountResponse?> FindAsync(string id, CancellationToken cancellationToken, string? memberId = null)
    {
        var account = await AccountReadAccess.Accounts(database, memberId)
            .AsNoTracking()
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .Where(account => account.Id == id)
            .SingleOrDefaultAsync(cancellationToken);

        return account is null ? null : Describe(account);
    }

    public async Task<(AccountResponse? Account, AccountError? Error)> CreateAsync(
        CreateAccountRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        var name = request.Name?.Trim();

        if (name is not { Length: > 0 and <= 40 })
        {
            return (null, AccountError.InvalidName);
        }

        var account = new Account
        {
            Name = name,
            NormalizedName = name.ToUpperInvariant()
        };

        database.Accounts.Add(account);

        var error = await SaveAsync(account, actor, "account_created", cancellationToken);

        return error is null
            ? (Describe(account), null)
            : (null, error);
    }

    public async Task<(AccountResponse? Account, AccountError? Error)> UpdateAsync(
        string id,
        UpdateAccountRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        var name = request.Name?.Trim();

        if (name is not { Length: > 0 and <= 40 })
        {
            return (null, AccountError.InvalidName);
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var account = await database.Accounts
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .SingleOrDefaultAsync(account => account.Id == id, cancellationToken);

        if (account is null)
        {
            return (null, AccountError.NotFound);
        }

        if (account.RetiredAtUtc is not null)
        {
            return (null, AccountError.Retired);
        }

        account.Name = name;
        account.NormalizedName = name.ToUpperInvariant();

        var error = await SaveAsync(account, actor, "account_updated", cancellationToken);

        if (error is null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return error is null
            ? (Describe(account), null)
            : (null, error);
    }

    public async Task<(DateTimeOffset? PurgeAtUtc, string? Error)> DeleteAsync(
        string id, string actor, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        database.ChangeTracker.Clear();
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == id, cancellationToken);

        if (account is null)
        {
            return (null, "not_found");
        }

        if (account.RetiredAtUtc is { } retiredAt)
        {
            return (retiredAt.AddDays(30), null);
        }

        var hasActivity = await database.AuditEvents.AnyAsync(audit => audit.SubjectId == id &&
            audit.Action == "transaction_posted", cancellationToken)
            || await database.AllowanceExecutions.AnyAsync(execution => execution.AccountId == id &&
                execution.CreditedAtUtc != null, cancellationToken);

        if (!hasActivity)
        {
            await PurgeAsync(account, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return (null, null);
        }

        var now = clock.GetUtcNow().ToUniversalTime();
        await database.MemberAccountAssignments
            .Where(assignment => assignment.AccountId == id)
            .ExecuteDeleteAsync(cancellationToken);
        account.RetiredAtUtc = now;
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor, SubjectId = id, Action = "account_retired", OccurredAtUtc = now
        });
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return (now.AddDays(30), null);
    }

    public async Task<string?> ReactivateAsync(string id, string? policy, string actor, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        if (policy is not (null or "credit" or "drop"))
        {
            return "invalid_missed_allowance_policy";
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == id, cancellationToken);

        if (account is null)
        {
            return "not_found";
        }

        if (account.RetiredAtUtc is not { } retiredAt)
        {
            return null;
        }

        var now = clock.GetUtcNow().ToUniversalTime();

        if (now >= retiredAt.AddDays(30))
        {
            return "account_deletion_expired";
        }

        var local = TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(settings.Timezone));
        var dueMonth = local.Year * 100 + local.Month;
        var revisions = await database.AllowanceRevisions.AsNoTracking()
            .Where(revision => revision.AccountId == id && revision.EffectiveMonth <= dueMonth)
            .OrderBy(revision => revision.SequenceNumber)
            .ToListAsync(cancellationToken);
        var executions = await database.AllowanceExecutions.Where(execution => execution.AccountId == id)
            .ToDictionaryAsync(execution => execution.BusinessMonth, cancellationToken);
        var outstanding = new List<(int Month, AllowanceRevision Revision)>();

        if (revisions.Count > 0)
        {
            for (var month = revisions.Min(revision => revision.EffectiveMonth); month <= dueMonth;
                month = month % 100 == 12 ? (month / 100 + 1) * 100 + 1 : month + 1)
            {
                var revision = revisions.Last(candidate => candidate.EffectiveMonth <= month);

                if (revision.Enabled && (!executions.TryGetValue(month, out var existing)
                    || existing.CreditedAtUtc is null && existing.DroppedAtUtc is null))
                {
                    outstanding.Add((month, revision));
                }
            }
        }

        if (outstanding.Count > 0 && policy is null)
        {
            return "missed_allowance_policy_required";
        }

        foreach (var (month, revision) in outstanding)
        {
            if (!executions.TryGetValue(month, out var execution))
            {
                execution = new AllowanceExecution
                {
                    AccountId = id, BusinessMonth = month, RevisionId = revision.Id,
                    IdempotencyKey = Guid.NewGuid().ToString()
                };
                database.AllowanceExecutions.Add(execution);
            }

            if (policy == "drop")
            {
                execution.DroppedAtUtc = now;
                execution.ErrorCode = null;
            }
        }

        account.RetiredAtUtc = null;
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor, SubjectId = id, Action = "account_reactivated", OccurredAtUtc = now
        });
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return null;
    }

    public async Task PurgeDueAsync(CancellationToken cancellationToken)
    {
        var cutoff = clock.GetUtcNow().ToUniversalTime().AddDays(-30);
        var retired = await database.Accounts.AsNoTracking().Where(account => account.RetiredAtUtc != null)
            .Select(account => new { account.Id, account.RetiredAtUtc })
            .ToListAsync(cancellationToken);

        foreach (var candidate in retired.Where(account => account.RetiredAtUtc <= cutoff))
        {
            database.ChangeTracker.Clear();
            await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == candidate.Id, cancellationToken);

            if (account?.RetiredAtUtc is { } retiredAt && retiredAt <= cutoff)
            {
                await PurgeAsync(account, cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
        }
    }

    private async Task PurgeAsync(Account account, CancellationToken cancellationToken)
    {
        var accountId = account.Id;
        await database.MemberAccountAssignments
            .Where(assignment => assignment.AccountId == accountId)
            .ExecuteDeleteAsync(cancellationToken);
        var removedEntries = await database.LedgerEntries.Where(entry => entry.AccountId == accountId)
            .ExecuteDeleteAsync(cancellationToken);
        await database.AllowanceExecutions.Where(execution => execution.AccountId == accountId).ExecuteDeleteAsync(cancellationToken);
        await database.AllowanceRevisions.Where(revision => revision.AccountId == accountId).ExecuteDeleteAsync(cancellationToken);
        await database.RetiredLedgerKeys.Where(key => key.AccountId == accountId).ExecuteDeleteAsync(cancellationToken);
        await database.AuditEvents.Where(audit => audit.SubjectId == accountId).ExecuteDeleteAsync(cancellationToken);

        if (removedEntries > 0)
        {
            var state = await database.LedgerMaintenanceStates.SingleAsync(cancellationToken);
            state.RetentionRevision = checked(state.RetentionRevision + 1);
        }

        if (account.ImageKey is { } imageKey && !await database.PendingImageDeletions.AnyAsync(
            pending => pending.ImageKey == imageKey, cancellationToken))
        {
            database.PendingImageDeletions.Add(new PendingImageDeletion { ImageKey = imageKey });
        }

        database.Accounts.Remove(account);
        await database.SaveChangesAsync(cancellationToken);
    }

    private async Task<AccountError?> SaveAsync(
        Account account,
        string actor,
        string action,
        CancellationToken cancellationToken)
    {
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor,
            SubjectId = account.Id,
            Action = action,
            OccurredAtUtc = DateTimeOffset.UtcNow
        });

        try
        {
            await database.SaveChangesAsync(cancellationToken);

            return null;
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 })
        {
            return AccountError.DuplicateName;
        }
    }

    private AccountResponse Describe(Account account) => new()
    {
        Id = account.Id,
        Name = account.Name,
        ImageUrl = account.ImageKey is { } key ? $"/api/accounts/{account.Id}/image?v={key}" : null,
        PurgeAtUtc = account.RetiredAtUtc?.AddDays(30),
        Currency = settings.Currency,
        Balance = account.BalanceMinorUnits is { } balance ? CurrencyAmount.Format(balance) : null,
        OpeningEntry = account.LedgerEntries.SingleOrDefault() is { } entry ? LedgerAdministration.Describe(entry, settings.Currency) : null
    };
}