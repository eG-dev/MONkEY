using Azure.Storage.Queues;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text;

using MONkEY.Data;
using MONkEY.Notifications.Email.Triggers;

namespace MONkEY.Notifications.Email.Services
{
    public class EmailTriggerService : IEmailTriggerService
    {
        private readonly ILogger _logger;

        private readonly QueueClient _emailsQueue;

        public EmailTriggerService(
            QueueServiceClient queueServiceClient,
            ILogger<EmailTriggerService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            ArgumentNullException.ThrowIfNull(queueServiceClient, nameof(queueServiceClient));
            _emailsQueue = queueServiceClient.GetQueueClient("emails");
        }

        public async Task TriggerMonthlyReport(string[] recipients, string serializedReportPayload)
        {
            _logger.LogInformation("Triggering monthly report email");

            var emailTrigger = new ReportEmailTrigger()
            {
                Recipients = recipients,
                EmailType = EmailType.Report,
                ReportType = ReportType.Monthly,
                Payload = serializedReportPayload,
            };

            byte[] buffer = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(emailTrigger));

            await _emailsQueue.SendMessageAsync(Convert.ToBase64String(buffer));
        }
    }
}
