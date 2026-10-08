namespace PocketMonkey.Api.Contracts.Accounts;

/// <summary>Shared account identity and display name, without financial fields.</summary>
public sealed record AccountResponse
{
    public required string Id { get; init; }

    public required string Name { get; init; }
}