namespace MONkEY.Data.Services
{
    public interface ITransactionService
    {
        Task InitAsync();

        Task AddAsync(Transaction model);

        Task DeleteAll(string tenantKey, string accountKey);

        Task<List<Transaction>> GetAsync(string tenantKey, string accountKey, int? pageSize = null, DateTimeOffset? olderThan = null);

        Task<List<Transaction>> GetBetweenAsync(string tenantKey, string accountKey, DateTimeOffset sinceDate, DateTimeOffset untilDate, string? triggeredBy = null);

        Task<Transaction?> GetLatestAsync(string tenantKey, string accountKey);

        Task<List<Transaction>> GetSinceAsync(string tenantKey, string accountKey, DateTimeOffset sinceDate, string? triggeredBy = null);
        
    }
}