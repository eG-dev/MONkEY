namespace PocketMonkey.Api.Entities;

public sealed class LedgerEntry
{
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public required string AccountId { get; init; }

    public long AmountMinorUnits { get; init; }

    public long SequenceNumber { get; init; }

    public required string IdempotencyKey { get; init; }

    public required string ActorId { get; init; }

    public required string ActorDisplayName { get; init; }

    public DateTimeOffset OccurredAtUtc { get; init; }

    public LedgerEntrySource Source { get; init; } = LedgerEntrySource.Opening;

    public string? Comment { get; init; }

    public int? AllowanceMonth { get; init; }
}