using Azure;
using Azure.Data.Tables;
using System.Diagnostics;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Name}, {Balance}, {PocketMoney}")]
    public class Account : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        public string Name { get; init; } = default!;

        public double Balance { get; set; }

        public double? PocketMoney { get; set; }

        public string TenantId { get; set; } = default!;

        public string? ProfileImage { get; set; } = default!;

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
