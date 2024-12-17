using Azure.Data.Tables;

namespace MONkEY.Data.Services
{
    public class AccountOwnerService : IAccountOwnerService
    {
        private const string TABLE_NAME = "accountOwners";

        private readonly TableClient _tableClient;

        public AccountOwnerService(TableServiceClient tableServiceClient)
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

        public async Task<AccountOwner?> AddAsync(AccountOwner model)
        {
            ValidateModel(model);

            // Force lower-case for the email address
            model.PartitionKey = model.PartitionKey.ToLowerInvariant();

            var response = await _tableClient.AddEntityAsync(model);

            if (response.IsError)
            {
                throw new InvalidOperationException($"Failed to add the {nameof(AccountOwner)} entry!");
            }

            var updatedModel = await GetByEmailAsync(model.Email);

            return updatedModel;
        }

        public async Task<AccountOwner?> UpdateAsync(AccountOwner model)
        {
            ValidateModel(model);

            var response = await _tableClient.UpdateEntityAsync(model, model.ETag);

            if (response.IsError)
            {
                throw new InvalidOperationException($"Failed to update the {nameof(AccountOwner)} entry!");
            }

            var updatedModel = await GetByEmailAsync(model.Email);

            return updatedModel;
        }

        public async Task DeleteAsync(string email)
        {
            var model = await GetByEmailAsync(email);

            if (model != null)
            {
                var response = await _tableClient.DeleteEntityAsync(email, model.RowKey);

                if (response.IsError)
                {
                    throw new InvalidOperationException($"Failed to delete the {nameof(AccountOwner)} entry with partion key {model.PartitionKey}!");
                }
            }
        }

        public async Task<AccountOwner?> GetByEmailAsync(string email)
        {
            var queryResult = _tableClient.QueryAsync<AccountOwner>(e =>
                e.PartitionKey == email.ToLowerInvariant());

            AccountOwner? model = null;
            await foreach (var entry in queryResult)
            {
                model = entry;
                break;
            }

            return model;
        }

        public async Task<List<AccountOwner>> GetAllAsync()
        {
            var queryResult = _tableClient.QueryAsync<AccountOwner>(e => true);

            List<AccountOwner> result = [];
            await foreach (var entry in queryResult)
            {
                result.Add(entry);
            }

            return [.. result.OrderBy(e => e.PartitionKey)];
        }

        public async Task<List<AccountOwner>> GetTenantOwnersAsync(string tenantKey)
        {
            var queryResult = _tableClient.QueryAsync<AccountOwner>(e =>
                e.RowKey == tenantKey);

            List<AccountOwner> result = [];
            await foreach (var entry in queryResult)
            {
                result.Add(entry);
            }

            return [.. result.OrderBy(e => e.Email)];
        }

        public async Task UpdatePreferencesAsync(string email, AccountOwnerPreferences preferences)
        {
            var model = await GetByEmailAsync(email);

            if (model == null)
            {
                throw new InvalidOperationException($"Failed to find the {nameof(AccountOwner)} entry by the specified email '{email}'!");
            }

            model.Preferences = preferences;

            await UpdateAsync(model);
        }

        private static void ValidateModel(AccountOwner model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (string.IsNullOrWhiteSpace(model.TenantKey))
            {
                throw new ArgumentException($"{nameof(model.TenantKey)} must be specified!");
            }

            if (string.IsNullOrWhiteSpace(model.Email))
            {
                throw new ArgumentException($"{nameof(model.Email)} must be specified!");
            }
        }
    }
}
