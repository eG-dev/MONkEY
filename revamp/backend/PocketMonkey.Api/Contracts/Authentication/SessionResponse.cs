using PocketMonkey.Api.Entities;

namespace PocketMonkey.Api.Contracts.Authentication;

/// <summary>Browser-safe current-user details without credentials or tokens.</summary>
public sealed record SessionResponse
{
    public required string Id { get; init; }

    public required string Username { get; init; }

    public required string DisplayName { get; init; }

    public required UserRole Role { get; init; }

    public required string Language { get; init; }

    public required string Theme { get; init; }

    public bool MustChangePassword { get; init; }
}