namespace PocketMonkey.Host.Contracts.Users;

/// <summary>Generated temporary password after a reset, returned only once.</summary>
public sealed record TemporaryPasswordResponse
{
    public required string TemporaryPassword { get; init; }
}
