using PocketMonkey.Host.Contracts.Authentication;

namespace PocketMonkey.Host.Contracts.Users;

/// <summary>Manager-visible user status without credential data.</summary>
public sealed record UserResponse
{
    public required SessionResponse User { get; init; }

    public bool IsActive { get; init; }
}