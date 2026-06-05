namespace MONkEY.Notifications.Email.Types
{
    public interface IEmailTriggerService
    {
        Task TriggerMonthlyReport(string[] recipients, string serializedReportPayload);
    }
}
