using System.Security.Claims;

namespace MONkEY.Data.Services
{
    public class IdentityService : IIdentityService
    {
        private readonly IAccountOwnerService _accountOwners;

        private KeyValuePair<string, AccountOwner?>? _cachedOwner = null;

        public IdentityService(
            IAccountOwnerService accountOwnerService)
        {
            ArgumentNullException.ThrowIfNull(accountOwnerService, nameof(accountOwnerService));

            _accountOwners = accountOwnerService;
        }

        public async Task<Identity?> FromPrincipal(ClaimsPrincipal principal)
        {
            if (principal?.Identity?.IsAuthenticated == true)
            {
                var name = principal.FindFirst("name")?.Value ?? string.Empty;
                var email = principal.Identity.Name ?? string.Empty;

                AccountOwner? owner;
                if (!_cachedOwner.HasValue || _cachedOwner.Value.Key != email)
                {
                    owner = await _accountOwners.GetByEmailAsync(email);

                    _cachedOwner = new KeyValuePair<string, AccountOwner?>(email, owner);
                }
                else
                {
                    owner = _cachedOwner.Value.Value;
                }

                return new()
                {
                    Name = name,
                    Email = email,
                    TenantKey = owner?.TenantKey ?? string.Empty,
                    IsGlobalAdmin = owner?.Role == AccountOwnerRole.GlobalAdmin,
                };
            }

            return null;
        }
    }
}
