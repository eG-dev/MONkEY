using System.Security.Claims;

namespace MONkEY.Identity.Types
{
    public interface IUserService
    {
        Task<User?> FromPrincipal(ClaimsPrincipal principal);

        void InvalidateCache(string email);
    }
}
