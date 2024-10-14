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
                await AddAsync(new Account() { Name = "Luis", Balance = 0.0, PocketMoney = 0.0 });
                await AddAsync(new Account() { Name = "Jonas", Balance = 0.0, PocketMoney = 0.0 });
                await AddAsync(new Account() { Name = "Charlotte", Balance = 0.0, PocketMoney = 0.0 });
            }
        }

        public async Task<List<Account>> GetAllAsync()
        {
            var queryResult = _tableClient.QueryAsync<Account>(e => true);

            List<Account> result = [];
            await foreach (Account model in queryResult)
            {
                result.Add(model);
            }

            return result;
        }

        public async Task<Account?> GetAsync(string name)
        {
            var queryResult = _tableClient.QueryAsync<Account>(e => e.PartitionKey == name);

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

            model.PartitionKey = model.Name;

            // See: https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns#log-tail-pattern
            string invertedTicks = string.Format("{0:D19}", DateTime.MaxValue.Ticks - DateTime.UtcNow.Ticks);
            model.RowKey = invertedTicks;

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Account model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
