using Azure.Storage.Queues.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

using MONkEY.Notifications.Email.Types;
using MONkEY.Notifications.Email.Types.Triggers;

namespace MONkEY.Functions.Workers
{
    public class EmailQueueProcessing
    {
        private readonly ILogger<EmailQueueProcessing> _logger;

        private readonly IEmailSenderService _email;

        private readonly IEmailTriggerHandler<ReportEmailTrigger> _reportHandler;

        public EmailQueueProcessing(
            IEmailSenderService emailSender,
            IEmailTriggerHandler<ReportEmailTrigger> reportHandler,
            ILogger<EmailQueueProcessing> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _email = emailSender ?? throw new ArgumentNullException(nameof(emailSender));

            _reportHandler = reportHandler ?? throw new ArgumentNullException(nameof(reportHandler));
        }

        [Function(nameof(EmailQueueProcessing))]
        public async Task Run([QueueTrigger("emails", Connection = "STORAGE_CONNECTION_STRING")] QueueMessage message)
        {
            _logger.LogInformation("Processing queue message with ID {MessageId} triggered at {InsertedOn}", message.MessageId, message.InsertedOn);

            EmailTrigger? trigger = null;

            try
            {
                trigger = JsonSerializer.Deserialize<EmailTrigger>(message.MessageText);
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to deserialize email trigger!\n{Message}", ex.Message);
            }

            if (trigger != null)
            {
                if (trigger.Recipients == null || trigger.Recipients.Length == 0)
                {
                    _logger.LogError("Got an email trigger without any recipient!");
                }
                else if (string.IsNullOrEmpty(trigger.Payload))
                {
                    _logger.LogError("Got an email trigger with an empty body!");
                }
                else
                {
                    switch (trigger.EmailType)
                    {
                        case EmailType.Report:
                            await HandleReportTrigger(message);
                            break;
                    }
                }
            }
        }

        private async Task HandleReportTrigger(QueueMessage message)
        {
            ReportEmailTrigger? trigger = null;

            try
            {
                trigger = JsonSerializer.Deserialize<ReportEmailTrigger>(message.MessageText);
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to deserialize email report trigger!\n{Message}", ex.Message);
            }

            if (trigger != null)
            {
                try
                {
                    await _reportHandler.HandleTrigger(trigger, _email);
                }
                catch (Exception ex)
                {
                    _logger.LogError("Failed to handle report trigger!\n{Message}", ex.Message);
                }
            }
        }
    }
}
