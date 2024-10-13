using System.Diagnostics;

namespace MONkEY.Functions.DTO
{
    [DebuggerDisplay("{Amount}, {TriggeredOn}, {TriggeredBy}")]
    public class ReportTransaction
    {
        public double Amount { get; set; }

        public string? TriggeredOn { get; set; }

        public string? TriggeredBy { get; set; }
    }
}
