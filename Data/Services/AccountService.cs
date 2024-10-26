using Azure.Data.Tables;

namespace MONkEY.Data.Services
{
    public class AccountService : IAccountService
    {
        private const string TABLE_NAME = "accounts";

        private readonly TableClient _tableClient;

        public AccountService(TableServiceClient tableServiceClient)
        {
            ArgumentNullException.ThrowIfNull(tableServiceClient, nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: TABLE_NAME
            );
        }

        public async Task InitAsync()
        {
            var response = await _tableClient.CreateIfNotExistsAsync();

            if (response.GetRawResponse().Status != 409)
            {
                await AddAsync(new Account() { PartitionKey = "klerner", Name = "Luis", Balance = 0.0, PocketMoney = 0.0 });
                await AddAsync(new Account() { PartitionKey = "klerner", Name = "Jonas", Balance = 0.0, PocketMoney = 0.0 }); 
                await AddAsync(new Account() { PartitionKey = "klerner", Name = "Charlotte", Balance = 0.0, PocketMoney = 0.0 });
            }
        }

        public async Task<List<Account>> GetAllAsync(string tenantKey)
        {
            var queryResult = _tableClient.QueryAsync<Account>(e =>
                e.PartitionKey == tenantKey);

            List<Account> result = [];
            await foreach (Account model in queryResult)
            {
                result.Add(model);
            }

            return [.. result.OrderBy(e => e.Name)];
        }

        public async Task<Account?> GetAsync(string tenantKey, string accountKey)
        {
            var queryResult = _tableClient.QueryAsync<Account>(e => 
                e.PartitionKey == tenantKey && 
                e.RowKey == accountKey);

            Account? model = null;
            await foreach (Account entry in queryResult)
            {
                model = entry;
                break;
            }

            return model;
        }

        public async Task<Account?> AddAsync(Account model)
        {
            ValidateModel(model);

            model.RowKey = Guid.NewGuid().ToString();

            var response = await _tableClient.AddEntityAsync(model);

            if (response.IsError)
            {
                throw new InvalidOperationException($"Failed to add the {nameof(Account)} entry!");
            }

            var updatedModel = await GetAsync(model.TenantKey, model.AccountKey);

            return updatedModel;
        }

        public async Task<Account?> UpdateAsync(Account model)
        {
            ValidateModel(model);

            var response = await _tableClient.UpdateEntityAsync(model, model.ETag);

            if (response.IsError)
            {
                throw new InvalidOperationException("Failed to update the account entry!");
            }

            var updatedModel = await GetAsync(model.TenantKey, model.AccountKey);

            return updatedModel;
        }

        private void ValidateModel(Account model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (string.IsNullOrWhiteSpace(model.TenantKey))
            {
                throw new ArgumentException($"{nameof(model.TenantKey)} must be specified!");
            }

            if (string.IsNullOrWhiteSpace(model.Name))
            {
                throw new ArgumentException($"{nameof(model.Name)} must be specified!");
            }
            if (model.Name.Length > 24)
            {
                throw new ArgumentException($"{nameof(model.Name)} is too long!");
            }
        }
    }
}
