namespace PocketMonkey.Storage.Entities;

public sealed class LedgerMaintenanceState
{
    public int Id { get; init; } = 1;

    public long LastAllocatedSequenceNumber { get; set; }

    public long RetentionRevision { get; set; }

    public DateTimeOffset? LastCompletedAtUtc { get; set; }
}