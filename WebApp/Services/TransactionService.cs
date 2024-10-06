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

        public IQueryable<Transaction> GetAll(string recipient)
        {
            var model = _tableClient.Query<Transaction>($"PartitionKey eq {recipient}");

            return model
                .AsQueryable();
        }

        public async Task InsertAsync(Transaction model)
        {
            if (model == null) throw new ArgumentNullException(nameof(model));

            model.PartitionKey = model.Recipient;
            model.RowKey = Guid.NewGuid().ToString();

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Transaction model)
        {
            if (model == null) throw new ArgumentNullException(nameof(model));

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
