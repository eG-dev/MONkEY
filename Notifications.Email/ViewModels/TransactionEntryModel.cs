namespace MONkEY.Notifications.Email.ViewModels
{
    public class TransactionEntryModel
    {
        public string TriggeredOn { get; set; } = string.Empty;

        public string TriggeredBy { get; set; } = string.Empty;

        public string? Comment { get; set; }

        public string Amount { get; set; } = string.Empty;
    }
}
