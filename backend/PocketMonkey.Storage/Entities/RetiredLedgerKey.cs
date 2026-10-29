namespace PocketMonkey.Storage.Entities;

public sealed class RetiredLedgerKey
{
    public required string IdempotencyKey { get; init; }

    public string? AccountId { get; init; }

    public DateTimeOffset RetiredAtUtc { get; init; }
}