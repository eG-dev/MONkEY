namespace PocketMonkey.Api.Contracts.Accounts;

/// <summary>An explicit opening amount in EUR and its request identity.</summary>
public sealed record OpeningBalanceRequest
{
    public string Amount { get; init; } = string.Empty;

    public string IdempotencyKey { get; init; } = string.Empty;

    public string? Comment { get; init; }
}