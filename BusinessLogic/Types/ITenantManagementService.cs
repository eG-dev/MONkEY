using MONkEY.Data.Entities;
using MONkEY.Data.Types;
using MONkEY.Identity.Types;

namespace MONkEY.BusinessLogic.Types
{
    public interface ITenantManagementService
    {
        Task AcceptInvitation(User user);

        Task ActivateUser(User user, TenantMemberPreferences preferences);

        Task<TenantMember?> CreateTenant(User user);

        Task DeclineInvitation(User user);

        Task DeleteTenant(User user);

        Task DeleteUser(User user, string email);

        Task InviteUser(User user, string email, TenantMemberRole role);
    }
}