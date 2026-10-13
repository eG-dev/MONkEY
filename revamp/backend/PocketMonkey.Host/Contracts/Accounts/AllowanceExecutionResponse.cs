namespace PocketMonkey.Host.Contracts.Accounts;

/// <summary>Durable business-month credit outcome without internal exception details.</summary>
public sealed record AllowanceExecutionResponse
{
    public required string BusinessMonth { get; init; }

    public required string Amount { get; init; }

    public required string Status { get; init; }

    public int? Attempts { get; init; }

    public DateTimeOffset? LastAttemptAtUtc { get; init; }

    public DateTimeOffset? CreditedAtUtc { get; init; }

    public string? ErrorCode { get; init; }
}