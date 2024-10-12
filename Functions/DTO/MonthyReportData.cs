namespace MONkEY.Functions.DTO
{
    public class MonthyReportData
    {
        public string? AccountName { get; set; }

        public string? PeriodName { get; set; }

        public double Balance { get; set; }

        public List<ReportTransaction> Transactions { get; set; } = [];
    }
}
