using PocketMonkey.Host.Identity;
using System.Text.Json.Serialization;
using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Contracts.Users;

/// <summary>Manager-controlled role, display name, and active status.</summary>
public sealed record UpdateUserRequest
{
    public string DisplayName { get; init; } = string.Empty;

    [JsonConverter(typeof(UserRoleRequestConverter))]
    public UserRole? Role { get; init; } = UserRole.Member;

    public bool IsActive { get; init; } = true;
}