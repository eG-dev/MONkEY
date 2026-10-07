namespace PocketMonkey.Api.Contracts.Authentication;

/// <summary>Authenticated password change requiring the current password.</summary>
public sealed record ChangePasswordRequest
{
    public string CurrentPassword { get; init; } = string.Empty;

    public string NewPassword { get; init; } = string.Empty;
}