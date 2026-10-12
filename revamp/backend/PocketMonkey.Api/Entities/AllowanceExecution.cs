namespace PocketMonkey.Api.Entities;

public sealed class AllowanceExecution
{
    public long Id { get; set; }

    public required string AccountId { get; init; }

    public int BusinessMonth { get; init; }

    public required string RevisionId { get; init; }

    public required string IdempotencyKey { get; init; }

    public int Attempts { get; set; }

    public DateTimeOffset? LastAttemptAtUtc { get; set; }

    public DateTimeOffset? CreditedAtUtc { get; set; }

    public string? ErrorCode { get; set; }
}