using System.Data;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Recovery;
using PocketMonkey.Storage;
using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Services;

public sealed class FinancialSnapshotService
{
    private readonly PocketMonkeyDbContext database;
    private readonly InstanceSettings settings;
    private readonly TimeProvider clock;

    public FinancialSnapshotService(PocketMonkeyDbContext database, InstanceSettings settings, TimeProvider clock)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.clock = clock ?? throw new ArgumentNullException(nameof(clock));
    }

    public async Task<FinancialSnapshot> CaptureAsync(CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var capturedAt = clock.GetUtcNow();

        var accounts = await database.Accounts.AsNoTracking().ToArrayAsync(cancellationToken);
        var entries = await database.LedgerEntries.AsNoTracking().ToArrayAsync(cancellationToken);

        var audits = await database.AuditEvents.AsNoTracking().ToArrayAsync(cancellationToken);

        var revisions = await database.AllowanceRevisions.AsNoTracking().ToArrayAsync(cancellationToken);
        var executions = await database.AllowanceExecutions.AsNoTracking().ToArrayAsync(cancellationToken);

        var keys = await database.RetiredLedgerKeys.AsNoTracking().ToArrayAsync(cancellationToken);
        var state = await database.LedgerMaintenanceStates.AsNoTracking().SingleOrDefaultAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new FinancialSnapshot
        {
            FormatVersion = 1,
            SnapshotId = Guid.NewGuid().ToString(),
            CapturedAtUtc = capturedAt,
            ApplicationVersion = Environment.GetEnvironmentVariable("MONKEY_BUILD_VERSION") ?? "development",

            Currency = settings.Currency,
            Timezone = settings.Timezone,
            TransactionRetentionMonths = settings.TransactionRetentionMonths,

            Accounts = accounts.Select(account => new SnapshotAccount
            {
                Id = account.Id,
                Name = account.Name,
                NormalizedName = account.NormalizedName,
                Balance = account.BalanceMinorUnits is { } balance ? FinancialSnapshotJson.Money(balance) : null
            }).ToArray(),

            LedgerEntries = entries.Select(entry => new SnapshotLedgerEntry
            {
                Id = entry.Id,
                AccountId = entry.AccountId,
                Amount = FinancialSnapshotJson.Money(entry.AmountMinorUnits),
                SequenceNumber = entry.SequenceNumber,
                IdempotencyKey = entry.IdempotencyKey,

                ActorId = entry.ActorId,
                ActorDisplayName = entry.ActorDisplayName,
                OccurredAtUtc = entry.OccurredAtUtc,

                Source = entry.Source.ToString().ToLowerInvariant(),
                Comment = entry.Comment,
                AllowanceMonth = entry.AllowanceMonth
            }).ToArray(),

            AuditEvents = audits.Select(audit => new SnapshotAuditEvent
            {
                Id = audit.Id,
                OccurredAtUtc = audit.OccurredAtUtc,
                ActorId = audit.ActorId,
                SubjectId = audit.SubjectId,
                Action = audit.Action
            }).ToArray(),

            AllowanceRevisions = revisions.Select(revision => new SnapshotAllowanceRevision
            {
                SequenceNumber = revision.SequenceNumber,
                Id = revision.Id,
                AccountId = revision.AccountId,
                PreviousRevisionId = revision.PreviousRevisionId,

                ActorId = revision.ActorId,
                OccurredAtUtc = revision.OccurredAtUtc,

                EffectiveMonth = revision.EffectiveMonth,
                Enabled = revision.Enabled,
                Amount = revision.AmountMinorUnits is { } amount ? FinancialSnapshotJson.Money(amount) : null
            }).ToArray(),

            AllowanceExecutions = executions.Select(execution => new SnapshotAllowanceExecution
            {
                Id = execution.Id,
                AccountId = execution.AccountId,
                BusinessMonth = execution.BusinessMonth,
                RevisionId = execution.RevisionId,
                IdempotencyKey = execution.IdempotencyKey,

                Attempts = execution.Attempts,
                LastAttemptAtUtc = execution.LastAttemptAtUtc,
                CreditedAtUtc = execution.CreditedAtUtc,
                ErrorCode = execution.ErrorCode
            }).ToArray(),

            RetiredLedgerKeys = keys.Select(key => new SnapshotRetiredLedgerKey
            {
                IdempotencyKey = key.IdempotencyKey,
                RetiredAtUtc = key.RetiredAtUtc
            }).ToArray(),

            LedgerMaintenanceState = new SnapshotMaintenanceState
            {
                LastAllocatedSequenceNumber = state?.LastAllocatedSequenceNumber ?? 0,
                RetentionRevision = state?.RetentionRevision ?? 0,
                LastCompletedAtUtc = state?.LastCompletedAtUtc
            }
        };
    }

    public async Task ImportAsync(FinancialSnapshot snapshot, CancellationToken cancellationToken)
    {
        FinancialSnapshotValidation.Validate(snapshot);

        if (snapshot.Currency != settings.Currency || snapshot.Timezone != settings.Timezone
            || snapshot.TransactionRetentionMonths != settings.TransactionRetentionMonths)
        {
            throw new InvalidDataException("snapshot_configuration_mismatch");
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var state = await database.LedgerMaintenanceStates.SingleOrDefaultAsync(cancellationToken);

        if (await database.Accounts.AnyAsync(cancellationToken) || await database.LedgerEntries.AnyAsync(cancellationToken)
            || await database.AllowanceRevisions.AnyAsync(cancellationToken) || await database.AllowanceExecutions.AnyAsync(cancellationToken)
            || await database.RetiredLedgerKeys.AnyAsync(cancellationToken)
            || state is not null && (state.LastAllocatedSequenceNumber != 0 || state.RetentionRevision != 0 || state.LastCompletedAtUtc is not null)
            || await database.AuditEvents.AnyAsync(audit => !audit.Action.StartsWith("user_") && audit.Action != "manager_bootstrapped", cancellationToken))
        {
            throw new InvalidDataException("recovery_target_not_empty");
        }

        database.Accounts.AddRange(snapshot.Accounts.Select(account => new Account
        {
            Id = account.Id,
            Name = account.Name,
            NormalizedName = account.NormalizedName,
            BalanceMinorUnits = account.Balance is null ? null : FinancialSnapshotJson.ParseMoney(account.Balance)
        }));

        await database.SaveChangesAsync(cancellationToken);

        database.AllowanceRevisions.AddRange(snapshot.AllowanceRevisions.Select(revision => new AllowanceRevision
        {
            SequenceNumber = revision.SequenceNumber,
            Id = revision.Id,
            AccountId = revision.AccountId,
            PreviousRevisionId = revision.PreviousRevisionId,

            ActorId = revision.ActorId,
            OccurredAtUtc = revision.OccurredAtUtc,

            EffectiveMonth = revision.EffectiveMonth,
            Enabled = revision.Enabled,
            AmountMinorUnits = revision.Amount is null ? null : FinancialSnapshotJson.ParseMoney(revision.Amount)
        }));

        await database.SaveChangesAsync(cancellationToken);

        database.AllowanceExecutions.AddRange(snapshot.AllowanceExecutions.Select(execution => new AllowanceExecution
        {
            Id = execution.Id,
            AccountId = execution.AccountId,
            BusinessMonth = execution.BusinessMonth,
            RevisionId = execution.RevisionId,
            IdempotencyKey = execution.IdempotencyKey,

            Attempts = execution.Attempts,
            LastAttemptAtUtc = execution.LastAttemptAtUtc,
            CreditedAtUtc = execution.CreditedAtUtc,
            ErrorCode = execution.ErrorCode
        }));

        database.LedgerEntries.AddRange(snapshot.LedgerEntries.Select(entry => new LedgerEntry
        {
            Id = entry.Id,
            AccountId = entry.AccountId,
            AmountMinorUnits = FinancialSnapshotJson.ParseMoney(entry.Amount),
            SequenceNumber = entry.SequenceNumber,
            IdempotencyKey = entry.IdempotencyKey,

            ActorId = entry.ActorId,
            ActorDisplayName = entry.ActorDisplayName,
            OccurredAtUtc = entry.OccurredAtUtc,

            Source = Enum.Parse<LedgerEntrySource>(entry.Source, true),
            Comment = entry.Comment,
            AllowanceMonth = entry.AllowanceMonth
        }));

        database.RetiredLedgerKeys.AddRange(snapshot.RetiredLedgerKeys.Select(key => new RetiredLedgerKey
        {
            IdempotencyKey = key.IdempotencyKey,
            RetiredAtUtc = key.RetiredAtUtc
        }));

        database.AuditEvents.AddRange(snapshot.AuditEvents.Select(audit => new AuditEvent
        {
            OccurredAtUtc = audit.OccurredAtUtc,
            ActorId = audit.ActorId,
            SubjectId = audit.SubjectId,
            Action = audit.Action
        }));

        database.AuditEvents.Add(new AuditEvent
        {
            OccurredAtUtc = clock.GetUtcNow(),
            ActorId = "host-operator",
            SubjectId = snapshot.SnapshotId,
            Action = "financial_snapshot_imported"
        });

        state ??= new LedgerMaintenanceState();

        if (database.Entry(state).State == EntityState.Detached)
        {
            database.LedgerMaintenanceStates.Add(state);
        }

        state.LastAllocatedSequenceNumber = snapshot.LedgerMaintenanceState.LastAllocatedSequenceNumber;
        state.RetentionRevision = snapshot.LedgerMaintenanceState.RetentionRevision;
        state.LastCompletedAtUtc = snapshot.LedgerMaintenanceState.LastCompletedAtUtc;

        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}