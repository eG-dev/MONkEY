using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Contracts.Accounts;

/// <summary>Exact signed ledger delta and immutable posting provenance.</summary>
public sealed record LedgerEntryResponse
{
    public required string Id { get; init; }

    public required string AccountId { get; init; }

    public required string Amount { get; init; }

    public required string Currency { get; init; }

    public required string ActorId { get; init; }

    public required string ActorDisplayName { get; init; }

    public DateTimeOffset OccurredAtUtc { get; init; }

    public required LedgerEntrySource Source { get; init; }

    public string? Comment { get; init; }

    public string? AllowanceMonth { get; init; }
}