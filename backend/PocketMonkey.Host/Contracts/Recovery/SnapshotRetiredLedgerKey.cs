namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotRetiredLedgerKey
{
    public required string IdempotencyKey { get; init; }
    public required DateTimeOffset RetiredAtUtc { get; init; }
}