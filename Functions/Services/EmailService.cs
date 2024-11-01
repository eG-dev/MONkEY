using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit.Text;
using MimeKit;
using System.Reflection;
using System.Globalization;
using System.Text;

using MONkEY.Functions.DTO;

namespace MONkEY.Functions.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger _logger;

        private readonly SmtpSettings _smtpSettings;

        public EmailService(ILoggerFactory loggerFactory, IOptions<SmtpSettings> smtpSettings)
        {
            _logger = loggerFactory.CreateLogger<EmailService>();

            _smtpSettings = smtpSettings.Value;
        }

        public async Task Send(IEnumerable<string> recipients, string subject, string content)
        {
            _logger.LogInformation($"Sending email with subject '{subject}' to {recipients.Count()} recipients.");

            MimeMessage email = new();

            var fromAddress = new MailboxAddress(_smtpSettings.SenderName, _smtpSettings.SenderEmail);
            email.From.Add(fromAddress);

            foreach (var recipient in recipients)
            {
                var toAddress = MailboxAddress.Parse(recipient);

                email.To.Add(toAddress);
            }

            email.Subject = subject;

            var bodyContent = GetTemplate("default").Replace("{{EMAIL_BODY}}", content);
            email.Body = new TextPart(TextFormat.Plain)
            {
                Text = bodyContent,
            };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_smtpSettings.User, _smtpSettings.Password);

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }

        public string GetTemplate(string templateName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            var resourceName = $"MONkEY.Functions.EmailTemplates.{templateName}.html";

            using Stream stream = assembly.GetManifestResourceStream(resourceName)!;
            using StreamReader reader = new(stream!);

            string template = reader.ReadToEnd();

            return template;
        }
    }
}
