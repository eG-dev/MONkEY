using Azure;
using Azure.Data.Tables;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Tenant}, {Name}, {Balance}, {PocketMoney}")]
    public class Account : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string Tenant { get => PartitionKey; }

        [IgnoreDataMember]
        public string AccountKey { get => RowKey; }

        public string Name { get; init; } = default!;

        public string? Image { get; set; } = default!;

        public double Balance { get; set; }

        public double? PocketMoney { get; set; }

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
