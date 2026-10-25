namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record FinancialSnapshot
{
    public required int FormatVersion { get; init; }
    public required string SnapshotId { get; init; }
    public required DateTimeOffset CapturedAtUtc { get; init; }
    public required string ApplicationVersion { get; init; }
    public required string Currency { get; init; }
    public required string Timezone { get; init; }
    public required int TransactionRetentionMonths { get; init; }
    public required SnapshotAccount[] Accounts { get; init; }
    public required SnapshotLedgerEntry[] LedgerEntries { get; init; }
    public required SnapshotAuditEvent[] AuditEvents { get; init; }
    public required SnapshotAllowanceRevision[] AllowanceRevisions { get; init; }
    public required SnapshotAllowanceExecution[] AllowanceExecutions { get; init; }
    public required SnapshotRetiredLedgerKey[] RetiredLedgerKeys { get; init; }
    public required SnapshotMaintenanceState LedgerMaintenanceState { get; init; }
}