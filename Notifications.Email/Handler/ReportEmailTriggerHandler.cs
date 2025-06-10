using System.Text.Json;

using MONkEY.Data;
using MONkEY.Notifications.Email.Services;
using MONkEY.Notifications.Email.Triggers;
using MONkEY.Support;

namespace MONkEY.Notifications.Email.Handler
{
    public class ReportEmailTriggerHandler : IEmailTriggerHandler<ReportEmailTrigger>
    {
        public async Task HandleTrigger(ReportEmailTrigger trigger, IEmailSenderService emailSender)
        {
            ArgumentNullException.ThrowIfNull(trigger, nameof(trigger));
            ArgumentNullException.ThrowIfNull(emailSender, nameof(emailSender));

            switch (trigger.ReportType)
            {
                case ReportType.Monthly:
                    var reportPayload = JsonSerializer.Deserialize<MonthlyReportPayload>(trigger.Payload);

                    if (reportPayload != null)
                    {
                        await SendMonthlyReport(emailSender, trigger, reportPayload);
                    }
                    break;
            }
        }

        private static async Task SendMonthlyReport(IEmailSenderService emailSender, ReportEmailTrigger trigger, MonthlyReportPayload report)
        {
            var emailSubject = $"{report.AccountName} - Monatsbericht für {report.ReportedPeriodName}";

            string transactionEntries = string.Empty;
            if (report.Transactions.Count > 0)
            {
                foreach (var transaction in report.Transactions)
                {
                    transactionEntries += string.Format(
                        "<tr style=\"font-size: small\"><td>{0} - {1}</td></tr>",
                        transaction.TriggeredOn,
                        transaction.TriggeredBy);
                    
                    if (!string.IsNullOrWhiteSpace(transaction.Comment))
                    {
                        transactionEntries += string.Format(
                            "<tr style=\"font-size: x-small\"><td><i>{0}</i></td></tr>",
                            transaction.Comment);
                    }

                    transactionEntries += string.Format(
                        "<tr><td><b style=\"color: {0}\">{1}€</b></td></tr>",
                        transaction.Amount < 0 ? "#B71C1C" : "#388E3C",
                        AmountUtils.FormatValue(transaction.Amount));

                    transactionEntries += "<tr style=\"height: 10px\"></tr>";
                }
            }
            else
            {
                transactionEntries = "<tr><td><p>Es gab keine Transaktionen.</p></td></tr>";
            }

            var emailBody = emailSender
                .GetTemplate("body_monthly_report")
                .Replace("{{ACCOUNT_NAME}}", report.AccountName)
                .Replace("{{REPORTED_PERIOD_NAME}}", report.ReportedPeriodName)
                .Replace("{{CLOSING_BALANCE}}", AmountUtils.FormatValue(report.ClosingBalance))
                .Replace("{{STARTING_BALANCE}}", AmountUtils.FormatValue(report.StartingBalance))
                .Replace("{{TRANSACTION_ENTRIES}}", transactionEntries);

            await emailSender.Send(trigger.Recipients, emailSubject, emailBody);
        }
    }
}
