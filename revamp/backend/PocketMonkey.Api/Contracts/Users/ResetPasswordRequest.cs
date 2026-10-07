namespace PocketMonkey.Api.Contracts.Users;

/// <summary>Manager-provided temporary password requiring a subsequent change.</summary>
public sealed record ResetPasswordRequest
{
    public string Password { get; init; } = string.Empty;
}