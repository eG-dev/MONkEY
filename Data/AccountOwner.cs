using Azure;
using Azure.Data.Tables;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace MONkEY.Data
{
    [DebuggerDisplay("{TenantKey}, {Email}")]
    public class AccountOwner : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string TenantKey { get => PartitionKey; }

        [IgnoreDataMember]
        public string Email { get => RowKey; }

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
