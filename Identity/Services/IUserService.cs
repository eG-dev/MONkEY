using System.Security.Claims;

namespace MONkEY.Identity.Services
{
    public interface IUserService
    {
        Task<User?> FromPrincipal(ClaimsPrincipal principal);
    }
}
