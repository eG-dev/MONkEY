using Azure.Storage.Queues.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

using MONkEY.Data;
using MONkEY.Notifications.Email;
using MONkEY.Notifications.Email.Services;

namespace MONkEY.Functions
{
    public class EmailQueueProcessing
    {
        private readonly ILogger<EmailQueueProcessing> _logger;

        private readonly IEmailSenderService _email;

        public EmailQueueProcessing(
            IEmailSenderService emailService,
            ILogger<EmailQueueProcessing> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _email = emailService ?? throw new ArgumentNullException(nameof(emailService));
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
                    _logger.LogError("Got email trigger without any recipient!");
                }
                else if (string.IsNullOrEmpty(trigger.Payload))
                {
                    _logger.LogError("Got email trigger with an empty body!");
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
            EmailTriggerForReport? trigger = null;

            try
            {
                trigger = JsonSerializer.Deserialize<EmailTriggerForReport>(message.MessageText);
            }
            catch (Exception ex)
            {
                _logger.LogError("Failed to deserialize email report trigger!\n{Message}", ex.Message);
            }

            if (trigger != null)
            {
                switch (trigger.ReportType)
                {
                    case ReportType.Monthly:
                        try
                        {
                            var reportPayload = JsonSerializer.Deserialize<MonthlyReportPayload>(trigger.Payload);

                            await SendMonthlyReport(trigger.Recipients, reportPayload!);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError("Failed to deserialize monthly report payload!\n{Message}", ex.Message);
                        }
                        break;
                }
            }
        }

        private async Task SendMonthlyReport(string[] recipients, MonthlyReportPayload report)
        {
            var emailSubject = $"{report.AccountName} - Bericht für {report.ReportedPeriodName}";

            string transactionEntries = string.Empty;
            if (report.Transactions.Count > 0)
            {
                transactionEntries += "<ul>";

                foreach (var transaction in report.Transactions)
                {
                    transactionEntries += string.Format(
                        "<li><p><b style=\"color: {0}\">{1}€</b> am {2} durch {3}<p></li>",
                        transaction.Amount < 0 ? "#B71C1C" : "#388E3C",
                        transaction.Amount.ToString("+0.##;-0.##"),
                        transaction.TriggeredOn,
                        transaction.TriggeredBy);
                }

                transactionEntries += "</ul>";
            }
            else
            {
                transactionEntries = "<p>Es gab keine Transaktionen.</p>";
            }

            var emailBody = _email
                .GetTemplate("body_monthly_report")
                .Replace("{{ACCOUNT_NAME}}", report.AccountName)
                .Replace("{{CLOSING_BALANCE}}", report.ClosingBalance.ToString())
                .Replace("{{STARTING_BALANCE}}", report.StartingBalance.ToString())
                .Replace("{{TRANSACTION_ENTRIES}}", transactionEntries, StringComparison.Ordinal);

            await _email.Send(recipients, emailSubject, emailBody);
        }
    }
}
