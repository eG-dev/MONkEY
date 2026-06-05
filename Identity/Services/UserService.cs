using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using MONkEY.Data.Entities;
using MONkEY.Data.Types;
using MONkEY.Identity.Types;

namespace MONkEY.Identity.Services
{
    public class UserService : IUserService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ITenantMemberService _tenantMembers;

        public UserService(
            IMemoryCache memoryCache,
            ITenantMemberService tenantMemberService)
        {
            _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
            _tenantMembers = tenantMemberService ?? throw new ArgumentNullException(nameof(tenantMemberService));
        }

        private Task<TenantMember?> GetTenantMemberAsync(string email)
        {
            return _memoryCache.GetOrCreateAsync(email, async e =>
            {
                var owner = await _tenantMembers.GetByEmailAsync(email);

                if (owner != null)
                {
                    if (owner.Status == TenantMemberStatus.Active)
                    {
                        e.SetAbsoluteExpiration(TimeSpan.FromMinutes(10));
                    }
                    else
                    {
                        // Non-active members should not be cached
                        e.SetAbsoluteExpiration(TimeSpan.FromMicroseconds(1));
                    }

                    var utcNow = DateTimeOffset.UtcNow;
                    if (owner.LastLoggedOn == null || owner.LastLoggedOn.Value.Date != utcNow.Date)
                    {
                        owner.LastLoggedOn = utcNow;
                        owner = await _tenantMembers.UpdateAsync(owner);
                    }
                }
                else
                {
                    // Unknown members should not be cached
                    e.SetAbsoluteExpiration(TimeSpan.FromMicroseconds(1));
                }

                return owner;
            });
        }



        public async Task<User?> FromPrincipal(ClaimsPrincipal principal)
        {
            if (principal?.Identity?.IsAuthenticated == true && !string.IsNullOrEmpty(principal.Identity.Name))
            {
                var name = principal.FindFirst("name")?.Value ?? string.Empty;
                var email = principal.Identity.Name;

                var member = await GetTenantMemberAsync(email);

                return new()
                {
                    Name = name,
                    Email = email,
                    TenantKey = member?.TenantKey ?? string.Empty,
                    LastLoggedOn = member?.LastLoggedOn,
                    TermsAcceptedOn = member?.TermsAcceptedOn,
                    Status = member?.Status ?? TenantMemberStatus.Undefined,
                    Role = member?.Role ?? TenantMemberRole.Undefined,
                    Preferences = member?.Preferences ?? new()
                };
            }

            return null;
        }

        public void InvalidateCache(string email)
        {
            _memoryCache.Remove(email);
        }
    }
}
