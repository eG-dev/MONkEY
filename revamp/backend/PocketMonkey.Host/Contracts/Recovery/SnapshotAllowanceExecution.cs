namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotAllowanceExecution
{
    public required long Id { get; init; }
    public required string AccountId { get; init; }
    public required int BusinessMonth { get; init; }
    public required string RevisionId { get; init; }
    public required string IdempotencyKey { get; init; }
    public required int Attempts { get; init; }
    public required DateTimeOffset? LastAttemptAtUtc { get; init; }
    public required DateTimeOffset? CreditedAtUtc { get; init; }
    public required string? ErrorCode { get; init; }
}