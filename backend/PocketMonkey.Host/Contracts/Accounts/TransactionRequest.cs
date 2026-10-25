using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Contracts.Accounts;

/// <summary>Positive manual deposit or withdrawal amount with an idempotency key.</summary>
public sealed record TransactionRequest
{
    public string Amount { get; init; } = string.Empty;

    public LedgerEntrySource Source { get; init; }

    public string IdempotencyKey { get; init; } = string.Empty;

    public string? Comment { get; init; }
}