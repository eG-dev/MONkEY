namespace PocketMonkey.Api.Contracts.Accounts;

/// <summary>Shared account identity, exact balance, display currency, and opening provenance.</summary>
public sealed record AccountResponse
{
    public required string Id { get; init; }

    public required string Name { get; init; }

    public required string Currency { get; init; }

    public string? Balance { get; init; }

    public LedgerEntryResponse? OpeningEntry { get; init; }
}