using MONkEY.Data;
using MONkEY.Identity;

namespace MONkEY.BusinessLogic.Services
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