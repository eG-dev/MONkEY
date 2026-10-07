namespace PocketMonkey.Api.Contracts.Users;

/// <summary>Manager-controlled role, display name, and active status.</summary>
public sealed record UpdateUserRequest
{
    public string DisplayName { get; init; } = string.Empty;

    public string Role { get; init; } = "Member";

    public bool IsActive { get; init; } = true;
}