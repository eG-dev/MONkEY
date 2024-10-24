namespace MONkEY.Data.Services
{
    public interface IAccountService
    {
        Task InitAsync();

        Task AddAsync(Account model);

        Task UpdateAsync(Account model);

        Task<List<Account>> GetAllAsync(string tenant);

        Task<Account?> GetAsync(string tenant, string accountKey);
    }
}