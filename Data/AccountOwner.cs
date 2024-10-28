using Azure;
using Azure.Data.Tables;
using System.Diagnostics;
using System.Runtime.Serialization;

using MONkEY.Data.Services;

namespace MONkEY.Data
{
    [DebuggerDisplay("{TenantKey}, {Email}")]
    public class AccountOwner : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string Email { get => PartitionKey; }

        [IgnoreDataMember]
        public string TenantKey { get => RowKey; }

        public string Role { get; set; } = AccountOwnerRole.Manager;

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
