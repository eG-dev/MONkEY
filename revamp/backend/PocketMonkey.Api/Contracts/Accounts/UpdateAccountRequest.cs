namespace PocketMonkey.Api.Contracts.Accounts;

/// <summary>Manager-provided replacement name for an existing account.</summary>
public sealed record UpdateAccountRequest
{
    public string Name { get; init; } = string.Empty;
}