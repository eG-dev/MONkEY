namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotAuditEvent
{
    public required long Id { get; init; }
    public required DateTimeOffset OccurredAtUtc { get; init; }
    public required string ActorId { get; init; }
    public required string SubjectId { get; init; }
    public required string Action { get; init; }
}