using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Identity;

namespace MONkEY.BusinessLogic.Services
{
    public class UsageTermsService : IUsageTermsService
    {
        private readonly DateTimeOffset USAGE_TERMS_VALID_FROM = DateTimeOffset.Parse("2024-10-31");

        private ITenantMemberService AccountOwners { get; }

        public UsageTermsService(
            ITenantMemberService accountOwnerService)
        {
            AccountOwners = accountOwnerService ?? throw new ArgumentNullException(nameof(accountOwnerService));
        }

        public bool HasAcceptedUsageTerms(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            return user.TermsAcceptedOn.GetValueOrDefault() > USAGE_TERMS_VALID_FROM;
        }

        public async Task<TenantMember?> Accept(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var accountOwner = await AccountOwners.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                accountOwner.TermsAcceptedOn = DateTimeOffset.UtcNow;
                accountOwner = await AccountOwners.UpdateAsync(accountOwner);
            }

            return accountOwner;
        }
    }
}
