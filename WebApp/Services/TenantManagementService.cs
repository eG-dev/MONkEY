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

            var accountOwner = await AccountOwners.GetByEmailAsync(user.Email);

            if (accountOwner == null)
            {
                accountOwner = await AccountOwners.AddAsync(new()
                {
                    PartitionKey = user.Email,
                    RowKey = Guid.NewGuid().ToString(),
                    Status = AccountOwnerStatus.Pending,
                    Role = AccountOwnerRole.Manager,
                });
            }

            return accountOwner;
        }

        public async Task ActivateUser(Identity user, AccountOwnerPreferences preferences)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));
            ArgumentNullException.ThrowIfNull(preferences, nameof(preferences));

            var accountOwner = await AccountOwners.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                accountOwner.Preferences = preferences;
                accountOwner.Status = AccountOwnerStatus.Active;

                await AccountOwners.UpdateAsync(accountOwner);
            }
        }

        public async Task InviteUser(Identity user, string email, AccountOwnerRole role)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("Inviting user is not assigned to a tenant!");
            }
            if (user.Role < AccountOwnerRole.Manager)
            {
                throw new InvalidOperationException("Inviting user is not allowed to manage the tenant!");
            }

            ArgumentException.ThrowIfNullOrEmpty("Email is required!", nameof(email));

            if (role == AccountOwnerRole.Undefined || role == AccountOwnerRole.GlobalAdmin)
            {
                throw new ArgumentException($"The role {role} can't be assigned!");
            }

            var accountOwner = await AccountOwners.GetByEmailAsync(email);

            if (accountOwner != null)
            {
                if (accountOwner.TenantKey == user.TenantKey)
                {
                    throw new InvalidOperationException("User is already part of the tenant!");
                }
                else
                {
                    throw new InvalidOperationException("User is already part of an another tenant!");
                }
            }
            else
            {
                await AccountOwners.AddAsync(new()
                {
                    PartitionKey = email,
                    RowKey = user.TenantKey,
                    Status = AccountOwnerStatus.Invited,
                    Role = role,
                });
            }
        }

        public async Task AcceptInvitation(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var accountOwner = await AccountOwners.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                if (accountOwner.Status != AccountOwnerStatus.Invited)
                {
                    throw new InvalidOperationException($"Status '{nameof(AccountOwnerStatus.Invited)}' is required!");
                }
                if (string.IsNullOrEmpty(accountOwner.TenantKey))
                {
                    throw new InvalidOperationException($"Tenant key is required!");
                }

                accountOwner.Status = accountOwner.Role == AccountOwnerRole.Member
                    // Members are automatically activated, because they don't get emails anyways
                    ? AccountOwnerStatus.Active
                    : AccountOwnerStatus.Pending;

                await AccountOwners.UpdateAsync(accountOwner);
            }
        }

        public async Task DeclineInvitation(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var accountOwner = await AccountOwners.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                if (accountOwner.Status != AccountOwnerStatus.Invited)
                {
                    throw new InvalidOperationException($"Status '{nameof(AccountOwnerStatus.Invited)}' is required!");
                }

                var tenantKey = accountOwner.TenantKey;

                await AccountOwners.DeleteAsync(accountOwner.Email);

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

        public async Task DeleteUser(Identity user, string email)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("Inviting user is not assigned to a tenant!");
            }
            if (user.Role < AccountOwnerRole.Manager)
            {
                throw new InvalidOperationException("Inviting user is not allowed to manage the tenant!");
            }
            if (user.Email == email)
            {
                throw new InvalidOperationException($"User must not delete own account!");
            }

            await AccountOwners.DeleteAsync(email);
        }
    }
}
