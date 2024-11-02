using MONkEY.Data;
using MONkEY.Data.Services;

namespace MONkEY.WebApp.Services
{
    public class UsageTermsService
    {
        private readonly DateTimeOffset USAGE_TERMS_VALID_FROM = DateTimeOffset.Parse("2024-10-31");

        private IAccountOwnerService AccountOwners { get; }

        public UsageTermsService(
            IAccountOwnerService accountOwnerService)
        {
            AccountOwners = accountOwnerService ?? throw new ArgumentNullException(nameof(accountOwnerService));
        }

        public bool HasAcceptedUsageTerms(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            return user.TermsAcceptedOn.GetValueOrDefault() > USAGE_TERMS_VALID_FROM;
        }

        public async Task<AccountOwner?> Accept(Identity user)
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
