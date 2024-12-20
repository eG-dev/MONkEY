using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit.Text;
using MimeKit;
using System.Reflection;

namespace MONkEY.Notifications.Email.Services
{
    public class EmailSenderService : IEmailSenderService
    {
        private readonly ILogger _logger;

        private readonly SmtpSettings _smtpSettings;

        public EmailSenderService(
            ILogger<EmailSenderService> logger, 
            IOptions<SmtpSettings> smtpSettings)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _smtpSettings = smtpSettings.Value;
        }

        public async Task Send(IEnumerable<string> recipients, string subject, string content)
        {
            _logger.LogInformation("Sending email with subject '{subject}' to {Count} recipients.", subject, recipients.Count());

            MimeMessage email = new();

            var fromAddress = new MailboxAddress(_smtpSettings.SenderName, _smtpSettings.SenderEmail);
            email.From.Add(fromAddress);

            foreach (var recipient in recipients)
            {
                var toAddress = MailboxAddress.Parse(recipient);

                email.To.Add(toAddress);
            }

            email.Subject = subject;

            var template = GetTemplate("default").Replace("{{EMAIL_BODY}}", content);
            var body = new TextPart(TextFormat.Html)
            {
                Text = template,
            };

            email.Body = body;

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_smtpSettings.User, _smtpSettings.Password);

#if !DEBUG || true
            await smtp.SendAsync(email);
#endif

            await smtp.DisconnectAsync(true);
        }

        public string GetTemplate(string templateName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = $"MONkEY.Notifications.Email.Templates.{templateName}.html";

            using Stream stream = assembly.GetManifestResourceStream(resourceName)!;
            using StreamReader reader = new(stream!);

            string template = reader.ReadToEnd();

            return template;
        }
    }
}
