using Azure;
using Azure.Data.Tables;

namespace WebApp.Models
{
    public class Transaction : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        public string Recipient { get; init; } = default!;

        public string Sponsor { get; init; } = default!;

        public double Amount { get; init; }

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
