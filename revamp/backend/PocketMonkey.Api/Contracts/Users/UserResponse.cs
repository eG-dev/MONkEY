using PocketMonkey.Api.Contracts.Authentication;

namespace PocketMonkey.Api.Contracts.Users;

/// <summary>Manager-visible user status without credential data.</summary>
public sealed record UserResponse
{
    public required SessionResponse User { get; init; }

    public bool IsActive { get; init; }
}