namespace PocketMonkey.Api.Contracts.Accounts;

public sealed record AllowanceConfigurationResponse
{
    public required string RevisionId { get; init; }
    public required string EffectiveMonth { get; init; }
    public bool Enabled { get; init; }
    public string? Amount { get; init; }
}