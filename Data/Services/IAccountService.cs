namespace MONkEY.Data.Services
{
    public interface IAccountService
    {
        Task InitAsync();

        Task AddAsync(Account model);

        Task UpdateAsync(Account model);

        Task<List<Account>> GetAllAsync();

        Task<Account?> GetAsync(string name);

        Task<Account?> GetByKeyAsync(string rowKey);
    }
}