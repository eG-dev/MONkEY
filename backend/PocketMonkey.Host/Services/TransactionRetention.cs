using System.Data;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Storage;
using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Services;

public sealed class TransactionRetention
{
    private readonly PocketMonkeyDbContext database;
    private readonly InstanceSettings settings;
    private readonly TimeProvider time;
    private readonly ILogger<TransactionRetention> logger;

    public TransactionRetention(PocketMonkeyDbContext database, InstanceSettings settings,
        TimeProvider time, ILogger<TransactionRetention> logger)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.time = time ?? throw new ArgumentNullException(nameof(time));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public static DateTimeOffset? Cutoff(DateTimeOffset now, int months)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(months);

        if (months == 0)
        {
            return null;
        }

        var utc = now.UtcDateTime;
        var first = new DateTimeOffset(utc.Year, utc.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var availableMonths = (utc.Year - 1) * 12 + utc.Month - 1;

        return first.AddMonths(-Math.Min(months, availableMonths));
    }

    public async Task<int> RunAsync(CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow().ToUniversalTime();
        var cutoff = Cutoff(now, settings.TransactionRetentionMonths);

        if (cutoff is null)
        {
            return 0;
        }

        var deleted = 0;
        var blocked = await database.LedgerEntries
            .AnyAsync(entry => entry.Source == LedgerEntrySource.Allowance && entry.OccurredAtUtc < cutoff.Value &&
                !database.AllowanceExecutions.Any(execution => execution.AccountId == entry.AccountId &&
                    execution.BusinessMonth == entry.AllowanceMonth && execution.IdempotencyKey == entry.IdempotencyKey &&
                    execution.CreditedAtUtc != null), cancellationToken);

        if (blocked)
        {
            logger.LogWarning("Retention skipped allowance entries with missing credited evidence");
        }

        while (true)
        {
            cancellationToken.ThrowIfCancellationRequested();
            database.ChangeTracker.Clear();
            await using var transaction = await database.Database.BeginTransactionAsync(
                IsolationLevel.Serializable, cancellationToken);
            var candidates = await database.LedgerEntries
                .Where(entry => entry.OccurredAtUtc < cutoff.Value &&
                    (entry.Source == LedgerEntrySource.Deposit || entry.Source == LedgerEntrySource.Withdrawal ||
                        (entry.Source == LedgerEntrySource.Allowance && database.AllowanceExecutions.Any(execution =>
                            execution.AccountId == entry.AccountId && execution.BusinessMonth == entry.AllowanceMonth &&
                            execution.IdempotencyKey == entry.IdempotencyKey && execution.CreditedAtUtc != null))))
                .OrderBy(entry => entry.OccurredAtUtc)
                .ThenBy(entry => entry.SequenceNumber)
                .Take(200)
                .ToListAsync(cancellationToken);

            if (candidates.Any(entry => entry.OccurredAtUtc.Offset != TimeSpan.Zero || entry.OccurredAtUtc >= cutoff.Value))
            {
                throw new InvalidOperationException("Retention candidate UTC representation is invalid.");
            }

            var maintenance = await database.LedgerMaintenanceStates.SingleAsync(cancellationToken);

            if (candidates.Count == 0)
            {
                maintenance.LastCompletedAtUtc = now;
                await database.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return deleted;
            }

            database.RetiredLedgerKeys.AddRange(candidates.Select(entry => new RetiredLedgerKey
            {
                IdempotencyKey = entry.IdempotencyKey,
                RetiredAtUtc = now
            }));
            database.LedgerEntries.RemoveRange(candidates);
            maintenance.RetentionRevision = checked(maintenance.RetentionRevision + 1);
            database.AuditEvents.Add(new AuditEvent
            {
                ActorId = "system:transaction-retention",
                SubjectId = "ledger",
                Action = "transaction_history_pruned",
                OccurredAtUtc = now
            });

            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            deleted = checked(deleted + candidates.Count);
            logger.LogInformation("Retention batch completed: {Count} entries before {CutoffUtc}", candidates.Count, cutoff);
        }
    }
}