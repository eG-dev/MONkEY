namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotMaintenanceState
{
    public required long LastAllocatedSequenceNumber { get; init; }
    public required long RetentionRevision { get; init; }
    public required DateTimeOffset? LastCompletedAtUtc { get; init; }
}