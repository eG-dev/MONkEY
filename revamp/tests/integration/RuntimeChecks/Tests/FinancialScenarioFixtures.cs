using System.Text.Json;
using PocketMonkey.Host.Contracts.Recovery;
using PocketMonkey.Host.Services;

namespace RuntimeChecks.Tests;

internal static class FinancialScenarioFixtures
{
    internal static readonly DateTimeOffset ReferenceTime = new(2026, 6, 15, 12, 0, 0, TimeSpan.Zero);
    internal const string AccountId = "10000000-0000-0000-0000-000000000001";

    public static async Task WriteAsync(string directory)
    {
        Directory.CreateDirectory(directory);

        foreach (var (name, snapshot) in All())
        {
            FinancialSnapshotValidation.Validate(snapshot);
            var bytes = JsonSerializer.SerializeToUtf8Bytes(snapshot, FinancialSnapshotJson.Options);
            await File.WriteAllBytesAsync(Path.Combine(directory, $"{name}.json"), bytes);
        }

        Console.WriteLine("financial_fixtures_generated");
    }

    internal static Dictionary<string, FinancialSnapshot> All()
    {
        var empty = FinancialRecoveryCheck.EmptySnapshot() with
        {
            SnapshotId = "90000000-0000-0000-0000-000000000001",
            CapturedAtUtc = ReferenceTime
        };
        var opening = Entry(1, "opening", "10.00");
        var signed = empty with
        {
            SnapshotId = "90000000-0000-0000-0000-000000000002",
            Accounts =
            [
                Account(AccountId, "Positive", "12.50"),
                Account("10000000-0000-0000-0000-000000000002", "Negative", "-5.00"),
                Account("10000000-0000-0000-0000-000000000003", "Zero", "0.00")
            ],
            LedgerEntries =
            [
                opening,
                Entry(2, "deposit", "5.00"),
                Entry(3, "withdrawal", "-2.50"),
                Entry(4, "opening", "-5.00") with { AccountId = "10000000-0000-0000-0000-000000000002" },
                Entry(5, "opening", "0.00") with { AccountId = "10000000-0000-0000-0000-000000000003" }
            ],
            LedgerMaintenanceState = State(5, 0)
        };
        var retained = empty with
        {
            SnapshotId = "90000000-0000-0000-0000-000000000003",
            Accounts = [Account(AccountId, "Retained history", "100.00")],
            LedgerEntries = new[] { opening }.Concat(Enumerable.Range(21, 25)
                .Select(sequence => Entry(sequence, "deposit", "1.00"))).ToArray(),
            RetiredLedgerKeys = [new SnapshotRetiredLedgerKey { IdempotencyKey = Key(2), RetiredAtUtc = ReferenceTime },
                new SnapshotRetiredLedgerKey { IdempotencyKey = Key(3), RetiredAtUtc = ReferenceTime }],
            LedgerMaintenanceState = State(50, 1)
        };
        var revision = new SnapshotAllowanceRevision
        {
            Id = "40000000-0000-0000-0000-000000000001",
            SequenceNumber = 1,
            AccountId = AccountId,
            PreviousRevisionId = "",
            ActorId = "historical-manager",
            OccurredAtUtc = ReferenceTime.AddMonths(-1),
            EffectiveMonth = 202606,
            Enabled = true,
            Amount = "2.50"
        };
        var credited = new SnapshotAllowanceExecution
        {
            Id = 1,
            AccountId = AccountId,
            BusinessMonth = 202606,
            RevisionId = revision.Id,
            IdempotencyKey = Key(2),
            Attempts = 1,
            LastAttemptAtUtc = ReferenceTime,
            CreditedAtUtc = ReferenceTime,
            ErrorCode = null
        };
        var allowance = empty with
        {
            SnapshotId = "90000000-0000-0000-0000-000000000004",
            Accounts = [Account(AccountId, "Allowance recovery", "12.50")],
            LedgerEntries = [opening, Entry(2, "allowance", "2.50") with { AllowanceMonth = 202606 }],
            AllowanceRevisions =
            [
                revision,
                revision with
                {
                    Id = "40000000-0000-0000-0000-000000000002", SequenceNumber = 2,
                    PreviousRevisionId = revision.Id, EffectiveMonth = 202608, Enabled = false,
                    OccurredAtUtc = ReferenceTime.AddMonths(1)
                }
            ],
            AllowanceExecutions =
            [
                credited,
                credited with
                {
                    Id = 2, BusinessMonth = 202607, IdempotencyKey = Key(3), CreditedAtUtc = null,
                    LastAttemptAtUtc = ReferenceTime.AddMonths(1)
                }
            ],
            LedgerMaintenanceState = State(2, 0)
        };

        return new Dictionary<string, FinancialSnapshot>
        {
            ["uninitialized"] = empty,
            ["signed-balances"] = signed,
            ["retained-history"] = retained,
            ["allowance-recovery"] = allowance
        };
    }

    private static SnapshotAccount Account(string id, string name, string balance)
    {
        return new SnapshotAccount { Id = id, Name = name, NormalizedName = name.ToUpperInvariant(), Balance = balance };
    }

    private static SnapshotLedgerEntry Entry(int sequence, string source, string amount)
    {
        return new SnapshotLedgerEntry
        {
            Id = $"20000000-0000-0000-0000-{sequence:D12}",
            AccountId = AccountId,
            Amount = amount,
            SequenceNumber = sequence,
            IdempotencyKey = Key(sequence),
            ActorId = "historical-manager",
            ActorDisplayName = "Historical Manager",
            OccurredAtUtc = ReferenceTime.AddTicks(sequence),
            Source = source,
            Comment = null,
            AllowanceMonth = null
        };
    }

    private static string Key(int sequence)
    {
        return $"30000000-0000-0000-0000-{sequence:D12}";
    }

    private static SnapshotMaintenanceState State(long sequence, long revision)
    {
        return new SnapshotMaintenanceState
        {
            LastAllocatedSequenceNumber = sequence,
            RetentionRevision = revision,
            LastCompletedAtUtc = revision == 0 ? null : ReferenceTime
        };
    }
}