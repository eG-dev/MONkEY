using Azure;
using Azure.Data.Tables;
using System.Diagnostics;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Recipient}, {Amount}, {TriggeredOn}, {Comment}")]
    public class Transaction : ITableEntity
    {
        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        public string Recipient { get; init; } = default!;

        public string TriggeredBy { get; init; } = default!;

        public DateTimeOffset TriggeredOn { get; set; } = default!;

        public double Amount { get; set; }

        public string? Comment { get; set; } = default!;

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
