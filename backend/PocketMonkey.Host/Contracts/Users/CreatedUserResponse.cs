using PocketMonkey.Host.Contracts.Authentication;

namespace PocketMonkey.Host.Contracts.Users;

/// <summary>Newly created user and the generated temporary password, returned only once.</summary>
public sealed record CreatedUserResponse
{
    public required SessionResponse User { get; init; }

    public required string TemporaryPassword { get; init; }
}
