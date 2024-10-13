using Azure;
using Azure.Data.Tables;

namespace MONkEY.Data.Models
{
    public class Report : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        public string AccountName { get; init; } = default!;

        public DateTimeOffset? ReportedPeriod { get; init; }

        public string SerializedPayload { get; init; } = default!;

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
