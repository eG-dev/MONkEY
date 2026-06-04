namespace MONkEY.Notifications.Email.Services
{
    public interface IEmailSenderService
    {
        Task Send(IEnumerable<string> recipients, string subject, string emailBody);
    }
}
