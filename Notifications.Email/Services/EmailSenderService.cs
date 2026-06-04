using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit.Text;
using MimeKit;

namespace MONkEY.Notifications.Email.Services
{
    public class EmailSenderService : IEmailSenderService
    {
        private readonly ILogger _logger;

        private readonly SmtpSettings _smtpSettings;

        private readonly ITemplateRenderer _templateRenderer;

        public EmailSenderService(
            ILogger<EmailSenderService> logger, 
            IOptions<SmtpSettings> smtpSettings,
            ITemplateRenderer templateRenderer)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _smtpSettings = smtpSettings.Value;

            _templateRenderer = templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));
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

            var renderedTemplate = await _templateRenderer.RenderAsync("default", new { email_body = content });
            var body = new TextPart(TextFormat.Html)
            {
                Text = renderedTemplate,
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
    }
}
