using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;

using MONkEY.Data;
using MONkEY.Data.Services;

namespace MONkEY.Identity.Services
{
    public class UserService : IUserService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly IAccountOwnerService _accountOwners;

        public UserService(
            IMemoryCache memoryCache,
            IAccountOwnerService accountOwnerService)
        {
            ArgumentNullException.ThrowIfNull(memoryCache, nameof(memoryCache));
            ArgumentNullException.ThrowIfNull(accountOwnerService, nameof(accountOwnerService));

            _memoryCache = memoryCache;
            _accountOwners = accountOwnerService;
        }

        private Task<AccountOwner?> GetAccountOwner(string email)
        {
            return _memoryCache.GetOrCreateAsync(email, async e =>
            {
                e.SetAbsoluteExpiration(TimeSpan.FromMinutes(10));

                var owner = await _accountOwners.GetByEmailAsync(email);

                var utcNow = DateTimeOffset.UtcNow;
                if (owner != null && (owner.LastLoggedOn == null || owner.LastLoggedOn.Value.Date != utcNow.Date))
                {
                    owner.LastLoggedOn = utcNow;
                    owner = await _accountOwners.UpdateAsync(owner);
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

                var owner = await GetAccountOwner(email);

                return new()
                {
                    Name = name,
                    Email = email,
                    TenantKey = owner?.TenantKey ?? string.Empty,
                    LastLoggedOn = owner?.LastLoggedOn,
                    TermsAcceptedOn = owner?.TermsAcceptedOn,
                    Status = owner?.Status ?? AccountOwnerStatus.Undefined,
                    Role = owner?.Role ?? AccountOwnerRole.Undefined,
                    Preferences = owner?.Preferences ?? new()
                };
            }

            return null;
        }
    }
}
