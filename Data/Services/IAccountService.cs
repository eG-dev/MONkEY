namespace MONkEY.Data.Services
{
    public interface IAccountService
    {
        Task InitAsync();

        Task<Account?> AddAsync(Account model);

        Task<Account?> UpdateAsync(Account model);

        Task Delete(string tenantKey, string accountKey);

        Task<List<Account>> GetAllAsync(string tenantKey);

        Task<Account?> GetAsync(string tenantKey, string accountKey);
    }
}