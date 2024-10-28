using System.Security.Claims;

namespace MONkEY.Data.Services
{
    public interface IIdentityService
    {
        Task<Identity?> FromPrincipal(ClaimsPrincipal principal);
    }
}
