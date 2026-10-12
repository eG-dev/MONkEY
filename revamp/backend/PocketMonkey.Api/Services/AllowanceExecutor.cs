using System.Data;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Services;

public sealed class AllowanceExecutor
{
    private readonly FoundationDbContext database;
    private readonly LedgerAdministration ledger;
    private readonly InstanceSettings settings;
    private readonly TimeProvider clock;
    private readonly ILogger<AllowanceExecutor> logger;

    public AllowanceExecutor(FoundationDbContext database, LedgerAdministration ledger, InstanceSettings settings,
        TimeProvider clock, ILogger<AllowanceExecutor> logger)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.clock = clock ?? throw new ArgumentNullException(nameof(clock));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        var local = TimeZoneInfo.ConvertTime(clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById(settings.Timezone));
        var dueMonth = local.Year * 100 + local.Month;
        var accounts = await database.AllowanceRevisions.AsNoTracking()
            .Where(revision => revision.EffectiveMonth <= dueMonth)
            .Select(revision => revision.AccountId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var accountId in accounts)
        {
            var revisions = await database.AllowanceRevisions.AsNoTracking()
                .Where(revision => revision.AccountId == accountId && revision.EffectiveMonth <= dueMonth)
                .OrderBy(revision => revision.SequenceNumber)
                .ToListAsync(cancellationToken);
            var completed = await database.AllowanceExecutions.AsNoTracking()
                .Where(execution => execution.AccountId == accountId && execution.CreditedAtUtc != null)
                .Select(execution => execution.BusinessMonth)
                .ToListAsync(cancellationToken);
            var creditedMonths = completed.ToHashSet();

            for (var month = revisions.Min(revision => revision.EffectiveMonth); month <= dueMonth; month = NextMonth(month))
            {
                cancellationToken.ThrowIfCancellationRequested();
                var revision = revisions.Last(candidate => candidate.EffectiveMonth <= month);

                if (!revision.Enabled || creditedMonths.Contains(month))
                {
                    continue;
                }

                if (!await ExecuteMonthAsync(accountId, month, revision, cancellationToken))
                {
                    break;
                }
            }
        }
    }

    private async Task<bool> ExecuteMonthAsync(string accountId, int month, AllowanceRevision revision,
        CancellationToken cancellationToken)
    {
        database.ChangeTracker.Clear();
        AllowanceExecution execution;

        await using (var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken))
        {
            execution = await database.AllowanceExecutions.SingleOrDefaultAsync(
                candidate => candidate.AccountId == accountId && candidate.BusinessMonth == month, cancellationToken)
                ?? new AllowanceExecution
                {
                    AccountId = accountId,
                    BusinessMonth = month,
                    RevisionId = revision.Id,
                    IdempotencyKey = Guid.NewGuid().ToString()
                };

            if (execution.CreditedAtUtc is not null)
            {
                return true;
            }

            if (execution.Id == 0)
            {
                database.AllowanceExecutions.Add(execution);
            }

            execution.Attempts++;
            execution.LastAttemptAtUtc = clock.GetUtcNow();
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        string? error;

        try
        {
            var configuration = await database.AllowanceRevisions.AsNoTracking()
                .SingleAsync(candidate => candidate.Id == execution.RevisionId, cancellationToken);
            var result = await ledger.PostAllowanceAsync(execution, configuration.AmountMinorUnits!.Value,
                clock.GetUtcNow(), cancellationToken);
            error = result.Error is null ? null
                : result.Error == LedgerError.BalanceOverflow ? "balance_overflow" : "execution_failed";
        }
        catch (Exception failure) when (failure is not OperationCanceledException)
        {
            logger.LogError(failure, "Allowance execution failed for month {BusinessMonth}; it will be retried", month);
            error = "execution_failed";
        }

        if (error is null)
        {
            return true;
        }

        database.ChangeTracker.Clear();
        await database.AllowanceExecutions
            .Where(candidate => candidate.Id == execution.Id && candidate.CreditedAtUtc == null)
            .ExecuteUpdateAsync(update => update.SetProperty(candidate => candidate.ErrorCode, error), cancellationToken);

        return false;
    }

    private static int NextMonth(int month) => month % 100 == 12 ? (month / 100 + 1) * 100 + 1 : month + 1;
}