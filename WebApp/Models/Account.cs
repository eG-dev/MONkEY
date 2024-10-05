using Azure;
using Azure.Data.Tables;

namespace WebApp.Models
{
    public class Account : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        public string Name { get; init; } = default!;

        public int Balance { get; init; }

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
