namespace MONkEY.Notifications.Email.ViewModels
{
    public class TransactionEntryModel
    {
        public string TriggeredOn { get; set; } = string.Empty;

        public string TriggeredBy { get; set; } = string.Empty;

        public double Amount { get; set; }

        public string? Comment { get; set; }

        public string AmountFormatted { get; set; } = string.Empty;

        public string AmountColor { get; set; } = "#388E3C";
    }
}
