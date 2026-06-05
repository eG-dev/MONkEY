namespace MONkEY.Notifications.Email.Types
{
    public interface IEmailSenderService
    {
        Task Send(IEnumerable<string> recipients, string subject, string emailBody);
    }
}
