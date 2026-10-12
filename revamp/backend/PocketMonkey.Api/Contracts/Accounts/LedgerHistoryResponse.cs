namespace PocketMonkey.Api.Contracts.Accounts;

/// <summary>Newest-first immutable ledger page with a snapshot-bounded continuation.</summary>
public sealed record LedgerHistoryResponse
{
    public required string Timezone { get; init; }

    public required IReadOnlyList<LedgerEntryResponse> Entries { get; init; }

    public string? NextCursor { get; init; }
}