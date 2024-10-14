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

        public async Task<Report?> GetForPeriodAsync(string accountName, DateTimeOffset reportedPeriod)
        {
            var queryResult = _tableClient.QueryAsync<Report>(e =>
                e.PartitionKey == accountName &&
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
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            model.PartitionKey = model.AccountName;

            // See: https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-design-patterns#log-tail-pattern
            string invertedTicks = string.Format("{0:D19}", DateTime.MaxValue.Ticks - DateTime.UtcNow.Ticks);
            model.RowKey = invertedTicks;

            await _tableClient.AddEntityAsync(model);
        }

        public async Task UpdateAsync(Report model)
        {
            ArgumentNullException.ThrowIfNull(model, nameof(model));

            await _tableClient.UpdateEntityAsync(model, model.ETag);
        }
    }
}
