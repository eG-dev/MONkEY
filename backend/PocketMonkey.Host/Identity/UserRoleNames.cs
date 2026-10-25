using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Identity;

public static class UserRoleNames
{
    public static string ToIdentityName(this UserRole role) => role switch
    {
        UserRole.Manager => "Manager",

        UserRole.Member => "Member",

        _ => throw new ArgumentOutOfRangeException(nameof(role), role, "Unknown user role.")
    };

    public static UserRole? Parse(string? name) =>
        name == UserRole.Manager.ToIdentityName()
            ? UserRole.Manager
            : name == UserRole.Member.ToIdentityName()
                ? UserRole.Member
                : null;
}