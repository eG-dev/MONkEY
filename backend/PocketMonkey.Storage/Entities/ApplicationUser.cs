using Microsoft.AspNetCore.Identity;

namespace PocketMonkey.Storage.Entities;

public sealed class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public bool MustChangePassword { get; set; }

    public string Language { get; set; } = "de";

    public string Theme { get; set; } = "system";
}