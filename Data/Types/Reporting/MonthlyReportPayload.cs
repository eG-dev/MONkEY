namespace MONkEY.Data.Types.Reporting
{
    public record MonthlyReportPayload
    {
        public required string AccountName { get; set; }

        public required string ReportedPeriodName { get; set; }

        public required double StartingBalance { get; set; }

        public required double ClosingBalance { get; set; }

        public List<ReportTransaction> Transactions { get; set; } = [];
    }
}
