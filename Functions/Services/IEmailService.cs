namespace MONkEY.Functions.Services
{
    public interface IEmailService
    {
        Task Send(IEnumerable<string> recipients, string subject, string emailBody);

        string GetTemplate(string templateName);
    }
}
