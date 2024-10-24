namespace MONkEY.Data.Services
{
    public interface ITransactionService
    {
        Task InitAsync();

        Task AddAsync(Transaction model);

        Task UpdateAsync(Transaction model);

        Task<List<Transaction>> GetAsync(string tenant, string accountKey, int? pageSize = null, DateTimeOffset? olderThan = null);

        Task<List<Transaction>> GetBetweenAsync(string tenant, string accountKey, DateTimeOffset sinceDate, DateTimeOffset untilDate, string? triggeredBy = null);

        Task<Transaction?> GetLatestAsync(string tenant, string accountKey);

        Task<List<Transaction>> GetSinceAsync(string tenant, string accountKey, DateTimeOffset sinceDate, string? triggeredBy = null);
        
    }
}