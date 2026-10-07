using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using PocketMonkey.Api.Entities;

namespace PocketMonkey.Api.Identity;

public sealed class UserClaimsFactory : UserClaimsPrincipalFactory<ApplicationUser, IdentityRole>
{
    public UserClaimsFactory(
        UserManager<ApplicationUser> users,
        RoleManager<IdentityRole> roles,
        IOptions<IdentityOptions> options)
        : base(users, roles, options)
    {
    }

    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(ApplicationUser user)
    {
        var identity = await base.GenerateClaimsAsync(user);
        identity.AddClaim(new Claim("password_ready", user.MustChangePassword ? "false" : "true"));
        return identity;
    }
}