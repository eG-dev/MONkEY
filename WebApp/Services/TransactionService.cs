using Azure.Data.Tables;
using WebApp.Models;

namespace WebApp.Services
{
    public class TransactionService
    {
        private readonly TableClient _tableClient;

        public TransactionService(TableServiceClient tableServiceClient)
        {
            if (tableServiceClient == null) throw new ArgumentNullException(nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: "transactions"
            );
        }

        public async Task InitAsync()
        {
            await _tableClient.CreateIfNotExistsAsync();
        }

        public async Task<List<Transaction>> GetAllAsync(string recipient, int? pageSize = null)
        {
            List<Transaction> result = new();

            await foreach (Transaction model in _tableClient.QueryAsync<Transaction>(e => e.PartitionKey == recipient, pageSize))
            {
                result.Add(model);
            }

            return result
                .OrderByDescending(e => e.Timestamp)
                .ToList();
        }

        public async Task<Transaction?> GetLatestAsync(string recipient)
        {
            var transactions = await GetAllAsync(recipient, 1);

            return transactions.Count > 0 ? transactions[0] : null;
        }

        public async Task InsertAsync(Transaction model)
        {
            if (model == null) throw new ArgumentNullException(nameof(model));
            if (model.Amount == 0) throw new ArgumentException("Amount must not be zero!");
            if (model.Comment?.Length > 100) throw new ArgumentException("Comment is too long!");

            model.PartitionKey = model.Recipient;
            model.RowKey = Guid.NewGuid().ToString();

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Transaction model)
        {
            if (model == null) throw new ArgumentNullException(nameof(model));
            if (model.Amount == 0) throw new ArgumentException("Amount must not be zero!");
            if (model.Comment?.Length > 100) throw new ArgumentException("Comment is too long!");

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
