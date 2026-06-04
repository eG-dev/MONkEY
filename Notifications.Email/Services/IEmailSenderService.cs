namespace MONkEY.Notifications.Email.Services
{
    public interface IEmailSenderService
    {
        Task Send(IEnumerable<string> recipients, string subject, string emailBody);

        string GetTemplate(string templateName);

        Task<string> RenderTemplate(string templateName, object model);
    }
}
