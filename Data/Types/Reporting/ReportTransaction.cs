using System.Diagnostics;

namespace MONkEY.Data.Types.Reporting
{
    [DebuggerDisplay("{Amount}, {TriggeredOn}, {TriggeredBy}")]
    public record ReportTransaction
    {
        public double Amount { get; set; }

        public required string TriggeredOn { get; set; }

        public required string TriggeredBy { get; set; }

        public string? Comment { get; set; }
    }
}
