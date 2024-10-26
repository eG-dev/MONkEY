namespace MONkEY.Data.Services
{
    public interface IAccountService
    {
        Task InitAsync();

        Task<Account?> AddAsync(Account model);

        Task<Account?> UpdateAsync(Account model);

        Task<List<Account>> GetAllAsync(string tenantKey);

        Task<Account?> GetAsync(string tenantKey, string accountKey);
    }
}