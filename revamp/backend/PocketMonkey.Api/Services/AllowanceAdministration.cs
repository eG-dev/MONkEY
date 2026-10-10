using System.Data;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Contracts.Accounts;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Services;

public sealed class AllowanceAdministration
{
    private readonly FoundationDbContext database;
    private readonly InstanceSettings settings;
    private readonly TimeProvider clock;

    public AllowanceAdministration(FoundationDbContext database, InstanceSettings settings, TimeProvider clock)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.clock = clock ?? throw new ArgumentNullException(nameof(clock));
    }

    public async Task<AllowanceResponse?> FindAsync(string accountId, CancellationToken cancellationToken)
    {
        if (!await database.Accounts.AnyAsync(account => account.Id == accountId, cancellationToken))
        {
            return null;
        }

        return await DescribeAsync(accountId, clock.GetUtcNow(), cancellationToken);
    }

    public async Task<(AllowanceResponse? Configuration, string? Error)> SaveAsync(
        string accountId, AllowanceRequest request, string actor, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        long? amount = null;

        if (request.Enabled)
        {
            if (!CurrencyAmount.TryParse(request.Amount, out var parsed) || parsed <= 0)
            {
                return (null, "invalid_allowance_amount");
            }

            amount = parsed;
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var account = await database.Accounts.AsNoTracking().SingleOrDefaultAsync(account => account.Id == accountId, cancellationToken);

        if (account is null)
        {
            return (null, "not_found");
        }

        if (request.Enabled && account.BalanceMinorUnits is null)
        {
            return (null, "not_initialized");
        }

        var latest = await database.AllowanceRevisions.AsNoTracking()
            .Where(revision => revision.AccountId == accountId)
            .OrderByDescending(revision => revision.SequenceNumber)
            .FirstOrDefaultAsync(cancellationToken);
        amount = request.Enabled ? amount : latest?.AmountMinorUnits;
        var now = clock.GetUtcNow();

        if (request.ExpectedRevisionId != latest?.Id)
        {
            if (latest is not null && latest.PreviousRevisionId == (request.ExpectedRevisionId ?? "") &&
                latest.ActorId == actor && latest.Enabled == request.Enabled && latest.AmountMinorUnits == amount)
            {
                return (await DescribeAsync(accountId, now, cancellationToken), null);
            }

            return (null, "allowance_conflict");
        }

        var effective = BusinessMonth(now).AddMonths(1);

        if (latest is not null && latest.Enabled == request.Enabled && latest.AmountMinorUnits == amount)
        {
            return (await DescribeAsync(accountId, now, cancellationToken), null);
        }

        var revision = new AllowanceRevision
        {
            AccountId = accountId,
            PreviousRevisionId = latest?.Id ?? "",
            ActorId = actor,
            OccurredAtUtc = now,
            EffectiveMonth = MonthKey(effective),
            Enabled = request.Enabled,
            AmountMinorUnits = amount
        };
        database.AllowanceRevisions.Add(revision);
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor,
            SubjectId = accountId,
            Action = "allowance_configured",
            OccurredAtUtc = now
        });

        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return (await DescribeAsync(accountId, now, cancellationToken), null);
    }

    private async Task<AllowanceResponse> DescribeAsync(string accountId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var month = BusinessMonth(now);
        var monthKey = MonthKey(month);
        var revisions = database.AllowanceRevisions.AsNoTracking().Where(revision => revision.AccountId == accountId);
        var latest = await revisions.OrderByDescending(revision => revision.SequenceNumber).FirstOrDefaultAsync(cancellationToken);
        var current = await revisions.Where(revision => revision.EffectiveMonth <= monthKey)
            .OrderByDescending(revision => revision.SequenceNumber).FirstOrDefaultAsync(cancellationToken);

        return new AllowanceResponse
        {
            Currency = settings.Currency,
            BusinessMonth = month.ToString("yyyy-MM", CultureInfo.InvariantCulture),
            NextEffectiveMonth = month.AddMonths(1).ToString("yyyy-MM", CultureInfo.InvariantCulture),
            LatestRevisionId = latest?.Id,
            Current = Describe(current),
            Scheduled = latest?.EffectiveMonth > monthKey ? Describe(latest) : null
        };
    }

    private DateTime BusinessMonth(DateTimeOffset now)
    {
        var local = TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(settings.Timezone));
        return new DateTime(local.Year, local.Month, 1);
    }

    private static int MonthKey(DateTime month) => month.Year * 100 + month.Month;

    private static AllowanceConfigurationResponse? Describe(AllowanceRevision? revision) => revision is null ? null : new()
    {
        RevisionId = revision.Id,
        EffectiveMonth = $"{revision.EffectiveMonth / 100:D4}-{revision.EffectiveMonth % 100:D2}",
        Enabled = revision.Enabled,
        Amount = revision.AmountMinorUnits is { } amount ? CurrencyAmount.Format(amount) : null
    };
}