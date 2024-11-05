namespace MONkEY.Data
{
    public class MonthlyReportPayload
    {
        public string? AccountName { get; set; }

        public string? ReportedPeriodName { get; set; }

        public double StartingBalance { get; set; }

        public double ClosingBalance { get; set; }

        public List<ReportTransaction> Transactions { get; set; } = [];
    }
}
