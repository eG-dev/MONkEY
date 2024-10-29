namespace MONkEY.Data.Services
{
    public interface IAccountOwnerService
    {
        Task InitAsync();

        Task<AccountOwner?> AddAsync(AccountOwner model);

        Task<AccountOwner?> UpdateAsync(AccountOwner model);

        Task DeleteAsync(string email);

        Task<AccountOwner?> GetByEmailAsync(string email);

        Task<List<AccountOwner>> GetAllAsync();

        Task<List<AccountOwner>> GetTenantOwnersAsync(string tenantKey);
    }
}