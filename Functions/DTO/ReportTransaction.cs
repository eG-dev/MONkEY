namespace MONkEY.Functions.DTO
{
    public class ReportTransaction
    {
        public double Amount { get; set; }

        public DateTimeOffset? Timestamp { get; set; }

        public string? TriggeredBy { get; set; }
    }
}
