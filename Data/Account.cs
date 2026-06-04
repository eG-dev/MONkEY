using Azure;
using Azure.Data.Tables;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace MONkEY.Data
{
    [DebuggerDisplay("{TenantKey}, {Name}, {Balance}, {Allowance}")]
    public class Account : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string TenantKey { get => PartitionKey; }

        [IgnoreDataMember]
        public string AccountKey { get => RowKey; }

        public string Name { get; set; } = default!;

        public string? Image { get; set; } = default!;

        public double Balance { get; set; }

        public double? Allowance { get; set; }

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
