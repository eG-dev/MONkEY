namespace PocketMonkey.Api.Contracts.Accounts;

public sealed record AllowanceResponse
{
    public required string Currency { get; init; }
    public required string BusinessMonth { get; init; }
    public required string NextEffectiveMonth { get; init; }
    public string? LatestRevisionId { get; init; }
    public AllowanceConfigurationResponse? Current { get; init; }
    public AllowanceConfigurationResponse? Scheduled { get; init; }
}