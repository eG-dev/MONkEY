using Azure.Data.Tables;
using MONkEY.Data.Models;

namespace MONkEY.Data.Services
{
    public class TransactionService
    {
        private readonly TableClient _tableClient;

        public TransactionService(TableServiceClient tableServiceClient)
        {
            ArgumentNullException.ThrowIfNull(tableServiceClient, nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: "transactions"
            );
        }

        public async Task InitAsync()
        {
            await _tableClient.CreateIfNotExistsAsync();
        }

        public async Task<List<Transaction>> GetAsync(string recipient, int? pageSize = null, DateTimeOffset? olderThan = null)
        {
            if (olderThan == null)
            {
                olderThan = DateTimeOffset.UtcNow;
            }

            List<Transaction> result = [];

            await foreach (Transaction model in _tableClient.QueryAsync<Transaction>(e => e.PartitionKey == recipient && e.Timestamp < olderThan, pageSize))
            {
                result.Add(model);

                if (pageSize != null && result.Count == pageSize)
                {
                    break;
                }
            }

            return [.. result.OrderByDescending(e => e.Timestamp)];
        }

        public async Task<Transaction?> GetLatestAsync(string recipient)
        {
            var transactions = await GetAsync(recipient, 1);

            return transactions.Count > 0 ? transactions[0] : null;
        }

        public async Task<List<Transaction>> GetByTriggerSince(string recipient, string triggeredBy, DateTimeOffset newerThan)
        {
            List<Transaction> result = [];

            await foreach (Transaction model in _tableClient.QueryAsync<Transaction>(e => e.PartitionKey == recipient && e.TriggedBy == triggeredBy && e.Timestamp >= newerThan))
            {
                result.Add(model);
            }

            return [.. result.OrderByDescending(e => e.Timestamp)];
        }

        public async Task InsertAsync(Transaction model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (model.Amount == 0) throw new ArgumentException("Amount must not be zero!");
            if (model.Comment?.Length > 100) throw new ArgumentException("Comment is too long!");

            model.PartitionKey = model.Recipient;
            model.RowKey = Guid.NewGuid().ToString();

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
