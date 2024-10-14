using Azure;
using Azure.Data.Tables;

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

        public async Task<List<Transaction>> GetAsync(string recipient, int? pageSize = null, DateTimeOffset? olderThan = null)
        {
            AsyncPageable<Transaction> queryResult;

            if (olderThan == null)
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == recipient,
                    pageSize);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == recipient &&
                    e.TriggeredOn < olderThan,
                    pageSize);
            }

            List<Transaction> result = [];
            await foreach (Transaction entry in queryResult)
            {
                result.Add(entry);

                if (pageSize != null && result.Count == pageSize)
                {
                    break;
                }
            }

            return [.. result.OrderByDescending(e => e.TriggeredOn)];
        }

        public async Task<Transaction?> GetLatestAsync(string recipient)
        {
            var transactions = await GetAsync(recipient, 1);

            return transactions.Count > 0 ? transactions[0] : null;
        }

        public async Task<List<Transaction>> GetSinceAsync(string recipient, DateTimeOffset sinceDate, string? triggeredBy = null)
        {
            AsyncPageable<Transaction> queryResult;

            if (string.IsNullOrEmpty(triggeredBy))
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == recipient &&
                    e.TriggeredOn >= sinceDate);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == recipient &&
                    e.TriggeredBy == triggeredBy &&
                    e.TriggeredOn >= sinceDate);
            }

            List<Transaction> result = [];
            await foreach (Transaction entry in queryResult)
            {
                result.Add(entry);
            }

            return [.. result.OrderByDescending(e => e.TriggeredOn)];
        }

        public async Task<List<Transaction>> GetBetweenAsync(string recipient, DateTimeOffset sinceDate, DateTimeOffset untilDate, string? triggeredBy = null)
        {
            AsyncPageable<Transaction> queryResult;

            if (string.IsNullOrEmpty(triggeredBy))
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == recipient &&
                    e.TriggeredOn >= sinceDate &&
                    e.TriggeredOn < untilDate);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Transaction>(e =>
                    e.PartitionKey == recipient &&
                    e.TriggeredBy == triggeredBy &&
                    e.TriggeredOn >= sinceDate &&
                    e.TriggeredOn < untilDate);
            }

            List<Transaction> result = [];
            await foreach (Transaction model in queryResult)
            {
                result.Add(model);
            }

            return [.. result.OrderByDescending(e => e.TriggeredOn)];
        }

        public async Task AddAsync(Transaction model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (model.Amount == 0) throw new ArgumentException("Amount must not be zero!");
            if (model.Comment?.Length > 100) throw new ArgumentException("Comment is too long!");

            model.PartitionKey = model.Recipient;

            if (model.TriggeredOn == DateTimeOffset.MinValue)
            {
                model.TriggeredOn = DateTimeOffset.UtcNow;
            }

            // See: https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns#log-tail-pattern
            string invertedTicks = string.Format("{0:D19}", DateTime.MaxValue.Ticks - DateTime.UtcNow.Ticks);
            model.RowKey = invertedTicks;

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Transaction model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (model.Amount == 0) throw new ArgumentException("Amount must not be zero!");
            if (model.Comment?.Length > 100) throw new ArgumentException("Comment is too long!");

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
