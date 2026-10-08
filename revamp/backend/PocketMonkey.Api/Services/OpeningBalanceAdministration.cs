using System.Data;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Contracts.Accounts;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Services;

public sealed class OpeningBalanceAdministration
{
    private readonly FoundationDbContext database;
    private readonly InstanceSettings settings;

    public OpeningBalanceAdministration(FoundationDbContext database, InstanceSettings settings)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public async Task<(OpeningEntryResponse? Entry, OpeningBalanceError? Error)> PostAsync(
        string accountId,
        OpeningBalanceRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        if (!CurrencyAmount.TryParse(request.Amount, out var amount))
        {
            return (null, OpeningBalanceError.InvalidAmount);
        }

        if (!Guid.TryParseExact(request.IdempotencyKey, "D", out var requestId))
        {
            return (null, OpeningBalanceError.InvalidIdempotencyKey);
        }

        var comment = request.Comment?.Trim();
        comment = string.IsNullOrEmpty(comment) ? null : comment;

        if (comment is { Length: > 500 })
        {
            return (null, OpeningBalanceError.InvalidComment);
        }

        var key = requestId.ToString();

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var existing = await database.LedgerEntries.SingleOrDefaultAsync(entry => entry.IdempotencyKey == key, cancellationToken);

        if (existing is not null)
        {
            return existing.AccountId == accountId && existing.ActorId == actor &&
                existing.AmountMinorUnits == amount && existing.Comment == comment
                ? (Describe(existing, settings.Currency), null)
                : (null, OpeningBalanceError.IdempotencyConflict);
        }

        var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == accountId, cancellationToken);

        if (account is null)
        {
            return (null, OpeningBalanceError.NotFound);
        }

        if (account.BalanceMinorUnits.HasValue)
        {
            return (null, OpeningBalanceError.AlreadyInitialized);
        }

        var actorName = await database.Users
            .Where(user => user.Id == actor)
            .Select(user => user.DisplayName)
            .SingleAsync(cancellationToken);
        var entry = new LedgerEntry
        {
            AccountId = accountId,
            AmountMinorUnits = amount,
            IdempotencyKey = key,
            ActorId = actor,
            ActorDisplayName = actorName,
            OccurredAtUtc = DateTimeOffset.UtcNow,
            Source = LedgerEntrySource.Opening,
            Comment = comment
        };

        account.BalanceMinorUnits = checked(0L + amount);
        database.LedgerEntries.Add(entry);
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor,
            SubjectId = accountId,
            Action = "opening_posted",
            OccurredAtUtc = entry.OccurredAtUtc
        });

        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return (Describe(entry, settings.Currency), null);
    }

    public static OpeningEntryResponse Describe(LedgerEntry entry, string currency) => new()
    {
        Id = entry.Id,
        AccountId = entry.AccountId,
        Amount = CurrencyAmount.Format(entry.AmountMinorUnits),
        Currency = currency,
        ActorId = entry.ActorId,
        ActorDisplayName = entry.ActorDisplayName,
        OccurredAtUtc = entry.OccurredAtUtc,
        Source = entry.Source,
        Comment = entry.Comment
    };
}