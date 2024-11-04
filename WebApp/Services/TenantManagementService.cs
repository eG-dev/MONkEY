using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Identity;

namespace MONkEY.WebApp.Services
{
    public class TenantManagementService
    {
        private IAccountOwnerService AccountOwners { get; }

        private AccountManagementService AccountManagement { get; }

        public TenantManagementService(
            IAccountOwnerService accountOwnerService,
            AccountManagementService accountManagementService)
        {
            AccountOwners = accountOwnerService ?? throw new ArgumentNullException(nameof(accountOwnerService));
            AccountManagement = accountManagementService ?? throw new ArgumentNullException(nameof(accountManagementService));
        }

        public async Task<AccountOwner?> CreateTenant(User user)
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

        public async Task DeleteTenant(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Role < AccountOwnerRole.Manager)
            {
                throw new InvalidOperationException("User is not allowed to manage the tenant!");
            }

            var tenantKey = user.TenantKey;

            await AccountOwners.DeleteAsync(user.Email);

            if (!string.IsNullOrEmpty(tenantKey))
            {
                var otherOwners = await AccountOwners.GetTenantOwnersAsync(tenantKey);

                foreach (var owner in otherOwners)
                {
                    await AccountOwners.DeleteAsync(owner.Email);
                }

                await AccountManagement.DeleteAll(user);
            }
        }

        public async Task ActivateUser(User user, AccountOwnerPreferences preferences)
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

        public async Task InviteUser(User user, string email, AccountOwnerRole role)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Role < AccountOwnerRole.Manager)
            {
                throw new InvalidOperationException("User is not allowed to manage the tenant!");
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

        public async Task AcceptInvitation(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Status != AccountOwnerStatus.Invited)
            {
                throw new InvalidOperationException($"User must be in '{nameof(AccountOwnerStatus.Invited)}' status!");
            }

            var accountOwner = await AccountOwners.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                accountOwner.Status = accountOwner.Role == AccountOwnerRole.Member
                    // Members are automatically activated, because they don't get emails anyways
                    ? AccountOwnerStatus.Active
                    : AccountOwnerStatus.Pending;

                await AccountOwners.UpdateAsync(accountOwner);
            }
        }

        public async Task DeclineInvitation(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Status != AccountOwnerStatus.Invited)
            {
                throw new InvalidOperationException($"User must be in '{nameof(AccountOwnerStatus.Invited)}' status!");
            }

            var tenantKey = user.TenantKey;

            await AccountOwners.DeleteAsync(user.Email);

            if (!string.IsNullOrEmpty(tenantKey))
            {
                // This is an edge-case if the user who invited the person has deleted their account in the meantime.
                // In this case we need to clean up the data.
                var otherOwners = await AccountOwners.GetTenantOwnersAsync(tenantKey);

                if (otherOwners.Count == 0)
                {
                    await AccountManagement.DeleteAll(user);
                }
            }
        }

        public async Task DeleteUser(User user, string email)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Role < AccountOwnerRole.Manager)
            {
                throw new InvalidOperationException("User is not allowed to manage the tenant!");
            }
            if (user.Email == email)
            {
                throw new InvalidOperationException($"User must not delete own account!");
            }

            await AccountOwners.DeleteAsync(email);
        }
    }
}
