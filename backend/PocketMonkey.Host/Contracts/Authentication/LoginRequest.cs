namespace PocketMonkey.Host.Contracts.Authentication;

/// <summary>Local username and password credentials.</summary>
public sealed record LoginRequest
{
    public string Username { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}