using MONkEY.Data;
using MONkEY.Data.Services;

namespace MONkEY.WebApp.Services
{
    public class TenantManagementService
    {
        private IAccountOwnerService AccountOwners { get; }

        private IAccountService Accounts { get; }

        public TenantManagementService(
            IAccountOwnerService accountOwnerService,
            IAccountService accountService)
        {
            AccountOwners = accountOwnerService ?? throw new ArgumentNullException(nameof(accountOwnerService));
            Accounts = accountService ?? throw new ArgumentNullException(nameof(accountService));
        }

        public async Task<AccountOwner?> CreateTenant(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var model = await AccountOwners.GetByEmailAsync(user.Email);

            if (model == null)
            {
                model = await AccountOwners.AddAsync(new()
                {
                    PartitionKey = user.Email,
                    RowKey = Guid.NewGuid().ToString(),
                    Status = AccountOwnerStatus.New,
                    Role = AccountOwnerRole.Manager,
                });
            }

            return model;
        }

        public async Task AcceptInvitation(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var model = await AccountOwners.GetByEmailAsync(user.Email);

            if (model != null)
            {
                if (model.Status != AccountOwnerStatus.Invited)
                {
                    throw new InvalidOperationException($"Status '{nameof(AccountOwnerStatus.Invited)}' is required!");
                }
                if (string.IsNullOrEmpty(model.TenantKey))
                {
                    throw new InvalidOperationException($"Tenant key is required!");
                }

                model.Status = AccountOwnerStatus.Active;

                await AccountOwners.UpdateAsync(model);
            }
        }

        public async Task DeclineInvitation(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var model = await AccountOwners.GetByEmailAsync(user.Email);

            if (model != null)
            {
                if (model.Status != AccountOwnerStatus.Invited)
                {
                    throw new InvalidOperationException($"Status '{nameof(AccountOwnerStatus.Invited)}' is required!");
                }

                var tenantKey = model.TenantKey;

                await AccountOwners.DeleteAsync(model.Email);

                if (!string.IsNullOrEmpty(tenantKey))
                {
                    // This is an edge-case if the user who invited the person has deleted their account in the meantime.
                    // In this case we need to clean up the data.
                    var otherOwners = await AccountOwners.GetTenantOwnersAsync(tenantKey);

                    if (otherOwners.Count == 0)
                    {
                        var accounts = await Accounts.GetAllAsync(tenantKey);

                        foreach (var account in accounts)
                        {
                            await Accounts.DeleteAsync(account.TenantKey, account.AccountKey);
                        }
                    }
                }
            }
        }
    }
}
