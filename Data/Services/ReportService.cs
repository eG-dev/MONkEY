using Azure.Data.Tables;

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

        public async Task<Report?> GetForPeriodAsync(string tenantKey, string accountKey, DateTimeOffset reportedPeriod)
        {
            var queryResult = _tableClient.QueryAsync<Report>(e =>
                e.PartitionKey == tenantKey &&
                e.AccountKey == accountKey &&
                e.ReportedPeriod == reportedPeriod);

            Report? model = null;
            await foreach (Report entry in queryResult)
            {
                model = entry;
                break;
            }

            return model;
        }

        public async Task AddAsync(Report model)
        {
            ValidateModel(model);

            // See: https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns#log-tail-pattern
            string invertedTicks = string.Format("{0:D19}", DateTime.MaxValue.Ticks - DateTime.UtcNow.Ticks);
            model.RowKey = invertedTicks;

            await _tableClient.AddEntityAsync(model);
        }

        private void ValidateModel(Report model)
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
