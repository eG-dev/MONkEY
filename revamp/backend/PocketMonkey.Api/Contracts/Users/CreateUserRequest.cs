namespace PocketMonkey.Api.Contracts.Users;

/// <summary>Manager-created user with a temporary password.</summary>
public sealed record CreateUserRequest
{
    public string Username { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string Role { get; init; } = "Member";
}