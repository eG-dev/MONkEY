namespace MONkEY.Notifications.Email.ViewModels
{
    public class MonthlyReportEmailModel
    {
        public string AccountName { get; set; } = string.Empty;

        public string ReportedPeriodName { get; set; } = string.Empty;

        public string ClosingBalance { get; set; } = string.Empty;

        public string StartingBalance { get; set; } = string.Empty;

        public List<TransactionEntryModel> Transactions { get; set; } = [];
    }
}
