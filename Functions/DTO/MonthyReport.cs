namespace MONkEY.Functions.DTO
{
    public class MonthyReport
    {
        public string? AccountName { get; set; }

        public string? ReportedPeriod { get; set; }

        public double Balance { get; set; }

        public List<ReportTransaction> Transactions { get; set; } = [];
    }
}
