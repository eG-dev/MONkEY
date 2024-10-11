using Azure.Data.Tables;
using MONkEY.Data.Models;

namespace MONkEY.Data.Services
{
    public class AccountService
    {
        private readonly TableClient _tableClient;

        public AccountService(TableServiceClient tableServiceClient)
        {
            ArgumentNullException.ThrowIfNull(tableServiceClient, nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: "accounts"
            );
        }

        public async Task InitAsync()
        {
            var response = await _tableClient.CreateIfNotExistsAsync();

            if (response.GetRawResponse().Status != 409)
            {
                await InsertAsync(new Account() { Name = "Luis", Balance = 0.0, PocketMoney = 0.0 });
                await InsertAsync(new Account() { Name = "Jonas", Balance = 0.0, PocketMoney = 0.0 });
                await InsertAsync(new Account() { Name = "Charlotte", Balance = 0.0, PocketMoney = 0.0 });
            }
        }

        public async Task<List<Account>> GetAllAsync()
        {
            List<Account> result = [];

            await foreach (Account model in _tableClient.QueryAsync<Account>(e => true))
            {
                result.Add(model);
            }

            return result;
        }

        public async Task<Account?> GetAsync(string name)
        {
            var query = _tableClient.QueryAsync<Account>(e => e.PartitionKey == name);

            Account? model = null;
            await foreach (Account entry in query)
            {
                model = entry;
            }

            return model;
        }

        public async Task InsertAsync(Account model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            model.PartitionKey = model.Name;
            model.RowKey = Guid.NewGuid().ToString();

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Account model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
