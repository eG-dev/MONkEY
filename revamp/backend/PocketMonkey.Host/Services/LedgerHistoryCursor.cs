namespace PocketMonkey.Host.Services;

internal sealed record LedgerHistoryCursor
{
    public required string AccountId { get; init; }

    public long Snapshot { get; init; }

    public long Before { get; init; }

    public long? RetentionRevision { get; init; }
}