namespace PocketMonkey.Api.Contracts.Accounts;

/// <summary>Manager-provided name for a shared account.</summary>
public sealed record CreateAccountRequest
{
    public string Name { get; init; } = string.Empty;
}