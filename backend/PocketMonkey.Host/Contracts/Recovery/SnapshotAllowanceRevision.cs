namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotAllowanceRevision
{
    public required long SequenceNumber { get; init; }
    public required string Id { get; init; }
    public required string AccountId { get; init; }
    public required string PreviousRevisionId { get; init; }
    public required string ActorId { get; init; }
    public required DateTimeOffset OccurredAtUtc { get; init; }
    public required int EffectiveMonth { get; init; }
    public required bool Enabled { get; init; }
    public required string? Amount { get; init; }
}