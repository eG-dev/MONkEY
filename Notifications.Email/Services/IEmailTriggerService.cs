namespace MONkEY.Notifications.Email.Services
{
    public interface IEmailTriggerService
    {
        Task TriggerMonthlyReport(string[] recipients, string serializedReportPayload);
    }
}
