namespace MONkEY.Data.Services
{
    public interface IAccountOwnerService
    {
        Task InitAsync();

        Task<AccountOwner?> AddAsync(AccountOwner model);

        Task DeleteAsync(string tenantKey, string email);

        Task<List<Account>> GetAllAsync(string tenantKey);
    }
}