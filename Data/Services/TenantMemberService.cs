using Azure.Data.Tables;
using MONkEY.Data.Entities;
using MONkEY.Data.Types;

namespace MONkEY.Data.Services
{
    public class TenantMemberService : ITenantMemberService
    {
        private const string TABLE_NAME = "tenantMembers";

        private readonly TableClient _tableClient;

        public TenantMemberService(TableServiceClient tableServiceClient)
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

        public async Task<TenantMember?> AddAsync(TenantMember model)
        {
            ValidateModel(model);

            // Force lower-case for the email address
            model.RowKey = model.Email.ToLowerInvariant();

            var response = await _tableClient.AddEntityAsync(model);

            if (response.IsError)
            {
                throw new InvalidOperationException($"Failed to add the {nameof(TenantMember)} entry!");
            }

            var updatedModel = await GetByEmailAsync(model.Email);

            return updatedModel;
        }

        public async Task<TenantMember?> UpdateAsync(TenantMember model)
        {
            ValidateModel(model);

            var response = await _tableClient.UpdateEntityAsync(model, model.ETag);

            if (response.IsError)
            {
                throw new InvalidOperationException($"Failed to update the {nameof(TenantMember)} entry!");
            }

            var updatedModel = await GetByEmailAsync(model.Email);

            return updatedModel;
        }

        public async Task DeleteAsync(string email)
        {
            var model = await GetByEmailAsync(email);

            if (model != null)
            {
                var response = await _tableClient.DeleteEntityAsync(model.PartitionKey, model.RowKey);

                if (response.IsError)
                {
                    throw new InvalidOperationException($"Failed to delete the {nameof(TenantMember)} entry with partion key {model.PartitionKey}!");
                }
            }
        }

        public async Task<List<string>> GetAllTenantKeysAsync()
        {
            var allOwners = await GetAllAsync();

            var tenantKeys = allOwners
                .DistinctBy(x => x.TenantKey)
                .Select(x => x.TenantKey)
                .ToList();

            return tenantKeys;
        }

        public async Task<TenantMember?> GetByEmailAsync(string email)
        {
            var queryResult = _tableClient.QueryAsync<TenantMember>(e =>
                e.RowKey == email.ToLowerInvariant());

            TenantMember? model = null;
            await foreach (var entry in queryResult)
            {
                model = entry;
                break;
            }

            return model;
        }

        public async Task<List<TenantMember>> GetAllAsync()
        {
            var queryResult = _tableClient.QueryAsync<TenantMember>(e => true);

            List<TenantMember> result = [];
            await foreach (var entry in queryResult)
            {
                result.Add(entry);
            }

            return [.. result.OrderBy(e => e.TenantKey).ThenBy(e => e.Email)];
        }

        public async Task<List<TenantMember>> GetTenantMembersAsync(string tenantKey)
        {
            var queryResult = _tableClient.QueryAsync<TenantMember>(e =>
                e.PartitionKey == tenantKey);

            List<TenantMember> result = [];
            await foreach (var entry in queryResult)
            {
                result.Add(entry);
            }

            return [.. result.OrderBy(e => e.Email)];
        }

        public async Task UpdatePreferencesAsync(string email, TenantMemberPreferences preferences)
        {
            var model = await GetByEmailAsync(email);

            if (model == null)
            {
                throw new InvalidOperationException($"Failed to find the {nameof(TenantMember)} entry by the specified email '{email}'!");
            }

            model.Preferences = preferences;

            await UpdateAsync(model);
        }

        private static void ValidateModel(TenantMember model)
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
