using Azure;
using Azure.Data.Tables;
using System.Diagnostics;
using System.Runtime.Serialization;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Tenant}, {AccountKey}, {ReportedPeriod}, {Type}")]
    public class Report : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string TenantKey { get => PartitionKey; }

        public string AccountKey { get; init; } = default!;

        public DateTimeOffset? ReportedPeriod { get; init; }

        public string? Type { get; init; }

        public string SerializedPayload { get; init; } = default!;

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
