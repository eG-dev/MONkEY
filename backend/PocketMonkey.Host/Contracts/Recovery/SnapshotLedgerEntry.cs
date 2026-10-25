namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotLedgerEntry
{
    public required string Id { get; init; }
    public required string AccountId { get; init; }
    public required string Amount { get; init; }
    public required long SequenceNumber { get; init; }
    public required string IdempotencyKey { get; init; }
    public required string ActorId { get; init; }
    public required string ActorDisplayName { get; init; }
    public required DateTimeOffset OccurredAtUtc { get; init; }
    public required string Source { get; init; }
    public required string? Comment { get; init; }
    public required int? AllowanceMonth { get; init; }
}