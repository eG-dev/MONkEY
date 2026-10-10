namespace PocketMonkey.Api.Contracts.Accounts;

public sealed record AllowanceRequest
{
    public bool Enabled { get; init; }
    public string? Amount { get; init; }
    public string? ExpectedRevisionId { get; init; }
}