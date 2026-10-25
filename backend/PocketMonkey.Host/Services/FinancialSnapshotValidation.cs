using System.Diagnostics.CodeAnalysis;
using PocketMonkey.Host.Contracts.Recovery;

namespace PocketMonkey.Host.Services;

public static class FinancialSnapshotValidation
{
    public static void Validate(FinancialSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (snapshot.FormatVersion != 1)
        {
            throw new InvalidDataException("snapshot_version_unsupported");
        }

        Require(Guid.TryParseExact(snapshot.SnapshotId, "D", out _));
        Text(snapshot.ApplicationVersion, 200);

        Require(snapshot.Currency is "EUR" or "USD");

        Text(snapshot.Timezone, 100);
        Require(snapshot.Timezone == "UTC" || TimeZoneInfo.TryConvertIanaIdToWindowsId(snapshot.Timezone, out _));

        Require(snapshot.TransactionRetentionMonths is >= 0 and <= 120);
        Require(snapshot.CapturedAtUtc.Offset == TimeSpan.Zero);

        Require(snapshot.Accounts is not null && snapshot.LedgerEntries is not null && snapshot.AuditEvents is not null
            && snapshot.AllowanceRevisions is not null && snapshot.AllowanceExecutions is not null
            && snapshot.RetiredLedgerKeys is not null && snapshot.LedgerMaintenanceState is not null);

        Unique(snapshot.Accounts!, account => account.Id);
        Unique(snapshot.Accounts!, account => account.NormalizedName);

        Unique(snapshot.LedgerEntries!, entry => entry.Id);
        Unique(snapshot.LedgerEntries!, entry => entry.SequenceNumber);
        Unique(snapshot.LedgerEntries!, entry => entry.IdempotencyKey);

        Unique(snapshot.AuditEvents!, audit => audit.Id);

        Unique(snapshot.AllowanceRevisions!, revision => revision.Id);
        Unique(snapshot.AllowanceRevisions!, revision => revision.SequenceNumber);

        Unique(snapshot.AllowanceExecutions!, execution => execution.Id);
        Unique(snapshot.AllowanceExecutions!, execution => (execution.AccountId, execution.BusinessMonth));
        Unique(snapshot.AllowanceExecutions!, execution => execution.IdempotencyKey);

        Unique(snapshot.RetiredLedgerKeys!, key => key.IdempotencyKey);

        var accounts = snapshot.Accounts!.ToDictionary(account => account.Id);
        var revisions = snapshot.AllowanceRevisions!.ToDictionary(revision => revision.Id);
        var retired = snapshot.RetiredLedgerKeys!.Select(key => key.IdempotencyKey).ToHashSet(StringComparer.Ordinal);
        var entries = snapshot.LedgerEntries!.ToDictionary(entry => entry.IdempotencyKey);
        var executions = snapshot.AllowanceExecutions!.ToDictionary(execution => execution.IdempotencyKey);
        var accountEntries = snapshot.LedgerEntries.ToLookup(entry => entry.AccountId);

        foreach (var key in snapshot.RetiredLedgerKeys)
        {
            Id(key.IdempotencyKey);
            Require(key.RetiredAtUtc.Offset == TimeSpan.Zero);
        }

        foreach (var account in accounts.Values)
        {
            Id(account.Id);
            Text(account.Name, 40);
            Require(account.Name == account.Name.Trim() && account.NormalizedName == account.Name.ToUpperInvariant());

            var ledger = accountEntries[account.Id].ToArray();

            Require(account.Balance is null
                ? ledger.Length == 0
                : ledger.Count(entry => entry.Source == "opening") == 1);

            if (account.Balance is not null)
            {
                var balance = FinancialSnapshotJson.ParseMoney(account.Balance);

                if (snapshot.LedgerMaintenanceState!.RetentionRevision == 0)
                {
                    var sum = ledger.Aggregate(0m, (total, entry) => total + FinancialSnapshotJson.ParseMoney(entry.Amount));

                    Require(sum == balance);
                }
            }
        }

        foreach (var entry in snapshot.LedgerEntries)
        {
            Id(entry.Id);
            Id(entry.IdempotencyKey);

            Require(accounts.ContainsKey(entry.AccountId) && entry.SequenceNumber > 0 && !retired.Contains(entry.IdempotencyKey));

            Text(entry.ActorId, 450);
            Text(entry.ActorDisplayName, 200);
            Require(entry.OccurredAtUtc.Offset == TimeSpan.Zero);

            var amount = FinancialSnapshotJson.ParseMoney(entry.Amount);

            Require(entry.Source switch
            {
                "opening" => entry.AllowanceMonth is null,

                "deposit" => amount > 0 && entry.AllowanceMonth is null,

                "withdrawal" => amount < 0 && entry.AllowanceMonth is null,

                "allowance" => amount > 0 && ValidMonth(entry.AllowanceMonth),

                _ => false
            });

            Require(entry.Comment is null || entry.Comment.Length is > 0 and <= 500 && entry.Comment == entry.Comment.Trim());

            if (entry.Source == "allowance")
            {
                Require(executions.TryGetValue(entry.IdempotencyKey, out var execution)
                    && execution.CreditedAtUtc is not null && execution.AccountId == entry.AccountId
                    && execution.BusinessMonth == entry.AllowanceMonth);
            }
        }

        foreach (var audit in snapshot.AuditEvents!)
        {
            Require(audit.Id > 0 && audit.OccurredAtUtc.Offset == TimeSpan.Zero);

            Text(audit.ActorId, 450);
            Text(audit.SubjectId, 450);
            Text(audit.Action, 100);
        }

        foreach (var group in snapshot.AllowanceRevisions.GroupBy(revision => revision.AccountId))
        {
            var previous = "";

            foreach (var revision in group.OrderBy(revision => revision.SequenceNumber))
            {
                Id(revision.Id);

                Require(accounts.ContainsKey(revision.AccountId) && revision.SequenceNumber > 0
                    && revision.PreviousRevisionId == previous && ValidMonth(revision.EffectiveMonth)
                    && revision.OccurredAtUtc.Offset == TimeSpan.Zero);

                Text(revision.ActorId, 450);

                Require(revision.Amount is null
                    ? !revision.Enabled
                    : FinancialSnapshotJson.ParseMoney(revision.Amount) > 0);
                Require(!revision.Enabled || accounts[revision.AccountId].Balance is not null);

                previous = revision.Id;
            }
        }

        foreach (var execution in snapshot.AllowanceExecutions)
        {
            Id(execution.IdempotencyKey);

            Require(execution.Id > 0 && execution.Attempts >= 0 && ValidMonth(execution.BusinessMonth)
                && revisions.TryGetValue(execution.RevisionId, out var revision)
                && revision.AccountId == execution.AccountId && revision.Enabled
                && revision.EffectiveMonth <= execution.BusinessMonth);

            Require(execution.LastAttemptAtUtc is null || execution.LastAttemptAtUtc.Value.Offset == TimeSpan.Zero);
            Require(execution.CreditedAtUtc is null || execution.CreditedAtUtc.Value.Offset == TimeSpan.Zero);

            Require(execution.ErrorCode is null or "balance_overflow" or "execution_failed");

            if (execution.CreditedAtUtc is not null)
            {
                Require(execution.Attempts > 0 && execution.LastAttemptAtUtc is not null && execution.ErrorCode is null);

                Require(entries.TryGetValue(execution.IdempotencyKey, out var entry)
                    ? entry.Source == "allowance" && entry.AccountId == execution.AccountId
                        && entry.AllowanceMonth == execution.BusinessMonth
                        && entry.Amount == revisions[execution.RevisionId].Amount
                    : retired.Contains(execution.IdempotencyKey));
            }
            else
            {
                Require(!entries.ContainsKey(execution.IdempotencyKey) && !retired.Contains(execution.IdempotencyKey));
            }
        }

        var state = snapshot.LedgerMaintenanceState!;

        Require(state.RetentionRevision >= 0 && state.LastAllocatedSequenceNumber >= 0
            && state.LastAllocatedSequenceNumber >= snapshot.LedgerEntries.Select(entry => entry.SequenceNumber).DefaultIfEmpty().Max()
            && (state.LastCompletedAtUtc is null || state.LastCompletedAtUtc.Value.Offset == TimeSpan.Zero));

        Require(state.RetentionRevision > 0 || retired.Count == 0);
    }

    private static bool ValidMonth(int? month)
    {
        return month is >= 101 and <= 999912 && month % 100 is >= 1 and <= 12;
    }

    private static void Unique<TRecord, TKey>(TRecord[] records, Func<TRecord, TKey> key)
    {
        Require(records.Length <= 1_000_000 && records.All(record => record is not null));
        Require(records.Select(key).Distinct().Count() == records.Length);
    }

    private static void Id(string value)
    {
        Require(Guid.TryParseExact(value, "D", out _) && value == value.ToLowerInvariant());
    }

    private static void Text(string value, int maximum)
    {
        Require(!string.IsNullOrWhiteSpace(value) && value.Length <= maximum);
    }

    private static void Require([DoesNotReturnIf(false)] bool condition)
    {
        if (!condition)
        {
            throw new InvalidDataException("snapshot_invalid");
        }
    }
}