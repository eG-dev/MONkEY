using Azure;
using Azure.Data.Tables;
using MONkEY.Support;

namespace MONkEY.Data.Services
{
    public class ReportService : IReportService
    {
        private const string TABLE_NAME = "reports";

        private readonly TableClient _tableClient;

        public ReportService(TableServiceClient tableServiceClient)
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

        public async Task AddAsync(Report model)
        {
            ValidateModel(model);

            // See: https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns#log-tail-pattern
            string invertedTicks = string.Format("{0:D19}", DateTime.MaxValue.Ticks - DateTime.UtcNow.Ticks);
            model.RowKey = invertedTicks;

            await _tableClient.AddEntityAsync(model);
        }

        public async Task DeleteForAccountAsync(string tenantKey, string accountKey)
        {
            var queryResult = _tableClient.QueryAsync<Report>(e =>
                e.PartitionKey == tenantKey &&
                e.AccountKey == accountKey);

            await foreach (var entry in queryResult)
            {
                await _tableClient.DeleteEntityAsync(entry);
            }
        }

        public async Task DeleteOlderThanAsync(string tenantKey, DateTimeOffset olderThan)
        {
            var queryResult = _tableClient.QueryAsync<Report>(e =>
                e.PartitionKey == tenantKey &&
                e.ReportedPeriod < olderThan.StartOfMonth());

            await foreach (var entry in queryResult)
            {
                await _tableClient.DeleteEntityAsync(entry);
            }
        }

        public async Task<List<Report>> GetAsync(string tenantKey, ReportType type, int? pageSize = null, DateTimeOffset? olderThan = null)
        {
            AsyncPageable<Report> queryResult;

            if (olderThan == null)
            {
                queryResult = _tableClient.QueryAsync<Report>(e =>
                        e.PartitionKey == tenantKey,
                    pageSize);
            }
            else
            {
                queryResult = _tableClient.QueryAsync<Report>(e =>
                        e.PartitionKey == tenantKey &&
                        e.ReportedPeriod < olderThan.Value.StartOfMonth(),
                    pageSize);
            }

            List<Report> result = [];
            await foreach (var entry in queryResult)
            {
                if (entry.Type == type)
                {
                    result.Add(entry);
                }

                if (pageSize != null && result.Count == pageSize)
                {
                    break;
                }
            }

            return [.. result.OrderByDescending(e => e.ReportedPeriod)];
        }

        public async Task<List<Report>> GetForPeriodAsync(string tenantKey, DateTimeOffset reportedPeriod, ReportType type)
        {
            var queryResult = _tableClient.QueryAsync<Report>(e =>
                e.PartitionKey == tenantKey &&
                e.ReportedPeriod == reportedPeriod.StartOfMonth());

            List<Report> result = [];
            await foreach (var entry in queryResult)
            {
                if (entry.Type == type)
                {
                    result.Add(entry);
                }
            }

            return result;
        }

        public async Task<Report?> GetLatestAsync(string tenantKey, string accountKey, ReportType type)
        {
            var queryResult = _tableClient.QueryAsync<Report>(e =>
                e.PartitionKey == tenantKey &&
                e.AccountKey == accountKey);

            Report? latest = null;
            await foreach (var entry in queryResult)
            {
                if (entry.Type == type)
                {
                    if (latest == null || entry.ReportedPeriod > latest.ReportedPeriod)
                    {
                        latest = entry;
                    }
                }
            }

            return latest;
        }

        private static void ValidateModel(Report model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            if (string.IsNullOrWhiteSpace(model.TenantKey))
            {
                throw new ArgumentException($"{nameof(model.TenantKey)} must be specified!");
            }

            if (string.IsNullOrWhiteSpace(model.AccountKey))
            {
                throw new ArgumentException($"{nameof(model.AccountKey)} must be specified!");
            }
        }
    }
}
