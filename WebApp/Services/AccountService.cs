using Azure.Data.Tables;
using WebApp.Models;

namespace WebApp.Services
{
    public class AccountService
    {
        private readonly TableClient _tableClient;

        public AccountService(TableServiceClient tableServiceClient)
        {
            if (tableServiceClient == null) throw new ArgumentNullException(nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: "accounts"
            );
        }

        public async Task InitAsync()
        {
            var response = await _tableClient.CreateIfNotExistsAsync();

            if (response.GetRawResponse().Status != 409)
            {
                await InsertAsync(new Account() { Name = "Luis", Balance = 0 });
                await InsertAsync(new Account() { Name = "Jonas", Balance = 0 });
                await InsertAsync(new Account() { Name = "Charlotte", Balance = 0 });
            }
        }

        public IQueryable<Account> GetAll()
        {
            var model = _tableClient.Query<Account>();

            return model
                .AsQueryable();
        }

        public async Task InsertAsync(Account model)
        {
            if (model == null) throw new ArgumentNullException(nameof(model));

            model.PartitionKey = model.Name;
            model.RowKey = Guid.NewGuid().ToString();

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Account model)
        {
            if (model == null) throw new ArgumentNullException(nameof(model));

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
