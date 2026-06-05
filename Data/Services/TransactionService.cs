using Azure;
using Azure.Data.Tables;
using MONkEY.Data.Entities;
using MONkEY.Data.Types;

namespace MONkEY.Data.Services
{
    public class TransactionService : ITransactionService
    {
        private const string TABLE_NAME = "transactions";

        private readonly TableClient _tableClient;

        public TransactionService(TableServiceClient tableServiceClient)
        {
            ArgumentNullException.ThrowIfNull(tableServiceClient, nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: TABLE_NAME
            );
        }

        public async Task InitAsync()
        {
            await _tableClient.CreateIfNotExistsAsync();
        }

        public async Task AddAsync(Transaction model)
        {
            ValidateModel(model);

            model.PartitionKey = model.TenantKey;

            if (model.TriggeredOn == DateTimeOffset.MinValue)
            {
                model.TriggeredOn = DateTimeOffset.UtcNow;
            }

            // See: https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns#log-tail-pattern
            string invertedTicks = string.Format("{0:D19}", DateTime.MaxValue.Ticks - DateTime.UtcNow.Ticks);
            model.RowKey = invertedTicks;

            await _tableClient.AddEntityAsync(model);
        }

        public async Task DeleteAllForAccountAsync(string tenantKey, string accountKey)
        {
            var queryResult = _tableClient.QueryAsync<Transaction>(e =>
                e.PartitionKey == tenantKey &&
                e.AccountKey == accountKey);

            await foreach (var entry in queryResult)
            {
                await _tableClient.DeleteEntityAsync(entry);
            }
        }

        public async Task DeleteOlderThanAsync(string tenantKey, DateTimeOffset olderThan)
        {
            var queryResult = _tableClient.QueryAsync<Transaction>(e =>
                e.PartitionKey == tenantKey &&
                e.TriggeredOn < olderThan);

            await foreach (var entry in queryResult)
            {
                await _tableClient.DeleteEntityAsync(entry);
            }
        }

        public async Task<List<Transaction>> GetAsync(string tenantKey, string accountKey, int? pageSize = null, DateTimeOffset? olderThan = null)
        {
            AsyncPageable<Transaction> queryResult;

            if (olderThan == null)
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                        e.PartitionKey == tenantKey &&
                        e.AccountKey == accountKey,
                    pageSize);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                        e.PartitionKey == tenantKey &&
                        e.AccountKey == accountKey &&
                        e.TriggeredOn < olderThan,
                    pageSize);
            }

            List<Transaction> result = [];
            await foreach (var entry in queryResult)
            {
                result.Add(entry);

                if (pageSize != null && result.Count == pageSize)
                {
                    break;
                }
            }

            return [.. result.OrderByDescending(e => e.TriggeredOn)];
        }

        public async Task<Transaction?> GetLatestAsync(string tenantKey, string accountKey)
        {
            var transactions = await GetAsync(tenantKey, accountKey, 1);

            return transactions.Count > 0 ? transactions[0] : null;
        }

        public async Task<List<Transaction>> GetSinceAsync(string tenantKey, string accountKey, DateTimeOffset sinceDate, string? triggeredBy = null)
        {
            AsyncPageable<Transaction> queryResult;

            if (string.IsNullOrEmpty(triggeredBy))
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == tenantKey &&
                    e.AccountKey == accountKey &&
                    e.TriggeredOn >= sinceDate);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == tenantKey &&
                    e.AccountKey == accountKey &&
                    e.TriggeredBy == triggeredBy &&
                    e.TriggeredOn >= sinceDate);
            }

            List<Transaction> result = [];
            await foreach (var entry in queryResult)
            {
                result.Add(entry);
            }

            return [.. result.OrderByDescending(e => e.TriggeredOn)];
        }

        public async Task<List<Transaction>> GetBetweenAsync(string tenantKey, string accountKey, DateTimeOffset sinceDate, DateTimeOffset untilDate, string? triggeredBy = null)
        {
            AsyncPageable<Transaction> queryResult;

            if (string.IsNullOrEmpty(triggeredBy))
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == tenantKey &&
                    e.AccountKey == accountKey &&
                    e.TriggeredOn >= sinceDate &&
                    e.TriggeredOn < untilDate);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == tenantKey &&
                    e.AccountKey == accountKey &&
                    e.TriggeredBy == triggeredBy &&
                    e.TriggeredOn >= sinceDate &&
                    e.TriggeredOn < untilDate);
            }

            List<Transaction> result = [];
            await foreach (var model in queryResult)
            {
                result.Add(model);
            }

            return [.. result.OrderByDescending(e => e.TriggeredOn)];
        }

        private static void ValidateModel(Transaction model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));
            
            if (string.IsNullOrWhiteSpace(model.TenantKey))
            {
                throw new ArgumentException($"{nameof(model.TenantKey)} must be specified!");
            }

            if (string.IsNullOrWhiteSpace(model.AccountKey))
            {
                throw new ArgumentException($"{nameof(model.AccountKey)} must be specified!");
            }

            if (model.Amount == 0)
            {
                throw new ArgumentException($"{nameof(model.Amount)} must not be zero!");
            }

            if (model.Comment?.Length > 100)
            {
                throw new ArgumentException($"{nameof(model.Comment)} is too long!");
            }
        }
    }
}
