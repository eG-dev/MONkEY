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

        public async Task<List<Account>> GetAllAsync(string tenant)
        {
            var queryResult = _tableClient.QueryAsync<Account>(e =>
                e.PartitionKey == tenant);

            List<Account> result = [];
            await foreach (Account model in queryResult)
            {
                result.Add(model);
            }

            return [.. result.OrderBy(e => e.Name)];
        }

        public async Task<Account?> GetAsync(string tenant, string accountKey)
        {
            var queryResult = _tableClient.QueryAsync<Account>(e => 
                e.PartitionKey == tenant && 
                e.RowKey == accountKey);

            Account? model = null;
            await foreach (Account entry in queryResult)
            {
                model = entry;
                break;
            }

            return model;
        }

        public async Task AddAsync(Account model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (string.IsNullOrWhiteSpace(model.TenantKey)) throw new ArgumentException("Tenant must be specified!");

            model.RowKey = Guid.NewGuid().ToString();

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Account model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (string.IsNullOrWhiteSpace(model.TenantKey)) throw new ArgumentException("Tenant must be specified!");

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
