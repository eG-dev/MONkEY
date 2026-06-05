using MONkEY.Data.Entities;

namespace MONkEY.Data.Types
{
    public interface ITenantMemberService
    {
        Task InitAsync();

        Task<TenantMember?> AddAsync(TenantMember model);

        Task<TenantMember?> UpdateAsync(TenantMember model);

        Task DeleteAsync(string email);

        Task<List<string>> GetAllTenantKeysAsync();

        Task<TenantMember?> GetByEmailAsync(string email);

        Task<List<TenantMember>> GetAllAsync();

        Task<List<TenantMember>> GetTenantMembersAsync(string tenantKey);

        Task UpdatePreferencesAsync(string email, TenantMemberPreferences preferences);
    }
}