using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Identity;
using MONkEY.Identity.Services;

namespace MONkEY.BusinessLogic.Services
{
    public class TenantManagementService : ITenantManagementService
    {
        private ITenantMemberService TenantMembers { get; }

        private IAccountManagementService AccountManagement { get; }

        private IUserService Users { get; }

        public TenantManagementService(
            ITenantMemberService tenantMemberService,
            IAccountManagementService accountManagementService,
            IUserService userService)
        {
            TenantMembers = tenantMemberService ?? throw new ArgumentNullException(nameof(tenantMemberService));
            AccountManagement = accountManagementService ?? throw new ArgumentNullException(nameof(accountManagementService));
            Users = userService ?? throw new ArgumentNullException(nameof(userService));
        }

        public async Task<TenantMember?> CreateTenant(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            var tenantMember = await TenantMembers.GetByEmailAsync(user.Email);

            if (tenantMember == null)
            {
                tenantMember = await TenantMembers.AddAsync(new()
                {
                    PartitionKey = Guid.NewGuid().ToString(),
                    RowKey = user.Email,
                    Status = TenantMemberStatus.Pending,
                    Role = TenantMemberRole.Manager,
                });
            }

            return tenantMember;
        }

        public async Task DeleteTenant(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Role < TenantMemberRole.Manager)
            {
                throw new InvalidOperationException("User is not allowed to manage the tenant!");
            }

            var tenantKey = user.TenantKey;

            await TenantMembers.DeleteAsync(user.Email);

            if (!string.IsNullOrEmpty(tenantKey))
            {
                var otherMembers = await TenantMembers.GetTenantMembersAsync(tenantKey);

                foreach (var member in otherMembers)
                {
                    await TenantMembers.DeleteAsync(member.Email);
                }

                await AccountManagement.DeleteAll(user);

                Users.InvalidateCache(user.Email);
            }
        }

        public async Task ActivateUser(User user, TenantMemberPreferences preferences)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));
            ArgumentNullException.ThrowIfNull(preferences, nameof(preferences));

            var accountOwner = await TenantMembers.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                accountOwner.Preferences = preferences;
                accountOwner.Status = TenantMemberStatus.Active;

                await TenantMembers.UpdateAsync(accountOwner);
            }
        }

        public async Task InviteUser(User user, string email, TenantMemberRole role)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Role < TenantMemberRole.Manager)
            {
                throw new InvalidOperationException("User is not allowed to manage the tenant!");
            }

            ArgumentException.ThrowIfNullOrEmpty("Email is required!", nameof(email));

            if (role == TenantMemberRole.Undefined || role == TenantMemberRole.GlobalAdmin)
            {
                throw new ArgumentException($"The role {role} can't be assigned!");
            }

            var accountOwner = await TenantMembers.GetByEmailAsync(email);

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
                await TenantMembers.AddAsync(new()
                {
                    PartitionKey = email,
                    RowKey = user.TenantKey,
                    Status = TenantMemberStatus.Invited,
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
            if (user.Status != TenantMemberStatus.Invited)
            {
                throw new InvalidOperationException($"User must be in '{nameof(TenantMemberStatus.Invited)}' status!");
            }

            var accountOwner = await TenantMembers.GetByEmailAsync(user.Email);

            if (accountOwner != null)
            {
                accountOwner.Status = accountOwner.Role == TenantMemberRole.Member
                    // Members are automatically activated, because they don't get emails anyways
                    ? TenantMemberStatus.Active
                    : TenantMemberStatus.Pending;

                await TenantMembers.UpdateAsync(accountOwner);
            }
        }

        public async Task DeclineInvitation(User user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (user.Status != TenantMemberStatus.Invited)
            {
                throw new InvalidOperationException($"User must be in '{nameof(TenantMemberStatus.Invited)}' status!");
            }

            var tenantKey = user.TenantKey;

            await TenantMembers.DeleteAsync(user.Email);

            if (!string.IsNullOrEmpty(tenantKey))
            {
                // This is an edge-case if the user who invited the person has deleted their account in the meantime.
                // In this case we need to clean up the data.
                var otherOwners = await TenantMembers.GetTenantMembersAsync(tenantKey);

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
            if (user.Role < TenantMemberRole.Manager)
            {
                throw new InvalidOperationException("User is not allowed to manage the tenant!");
            }
            if (user.Email == email)
            {
                throw new InvalidOperationException($"User must not delete own account!");
            }

            await TenantMembers.DeleteAsync(email);

            Users.InvalidateCache(email);
        }
    }
}
