namespace PocketMonkey.Host.Contracts.Recovery;

public sealed record SnapshotAccount
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string NormalizedName { get; init; }
    public required string? Balance { get; init; }
    public required DateTimeOffset? RetiredAtUtc { get; init; }
}