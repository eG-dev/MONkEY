namespace MONkEY.Data.Services
{
    public interface ITransactionService
    {
        Task InitAsync();

        Task AddAsync(Transaction model);

        Task UpdateAsync(Transaction model);

        Task<List<Transaction>> GetAsync(string recipient, int? pageSize = null, DateTimeOffset? olderThan = null);

        Task<List<Transaction>> GetBetweenAsync(string recipient, DateTimeOffset sinceDate, DateTimeOffset untilDate, string? triggeredBy = null);

        Task<Transaction?> GetLatestAsync(string recipient);

        Task<List<Transaction>> GetSinceAsync(string recipient, DateTimeOffset sinceDate, string? triggeredBy = null);
        
    }
}