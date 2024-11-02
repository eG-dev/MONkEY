using System.Security.Claims;

namespace MONkEY.Data.Services
{
    public class IdentityService : IIdentityService
    {
        private readonly DateTimeOffset USAGE_TERMS_VALID_FROM = DateTimeOffset.Parse("2024-10-31");

        private readonly IAccountOwnerService _accountOwners;

        private KeyValuePair<string, AccountOwner?>? _cachedOwner = null;
        private DateTimeOffset _cacheTimestamp = DateTimeOffset.UtcNow;


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

                var utcNow = DateTimeOffset.UtcNow;

                AccountOwner? owner;
                if (!_cachedOwner.HasValue ||
                    _cachedOwner.Value.Key != email ||
                    (utcNow - _cacheTimestamp) > TimeSpan.FromMinutes(30))
                {
                    owner = await _accountOwners.GetByEmailAsync(email);

                    if (owner != null && (owner.LastLoggedOn == null || owner.LastLoggedOn.Value.Date != utcNow.Date))
                    {
                        owner.LastLoggedOn = utcNow;
                        owner = await _accountOwners.UpdateAsync(owner);
                    }

                    _cachedOwner = new KeyValuePair<string, AccountOwner?>(email, owner);
                    _cacheTimestamp = utcNow;
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
                    LastLoggedOn = owner?.LastLoggedOn,
                    TermsAcceptedOn = owner?.TermsAcceptedOn,
                    Status = owner?.Status ?? AccountOwnerStatus.Undefined,
                    Role = owner?.Role ?? AccountOwnerRole.Undefined,
                    HasAcceptedUsageTerms = owner?.TermsAcceptedOn.GetValueOrDefault() > USAGE_TERMS_VALID_FROM,
                };
            }

            return null;
        }
    }
}
