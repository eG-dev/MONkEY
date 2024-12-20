using System.Text.Json;

using MONkEY.Data;
using MONkEY.Notifications.Email.Services;
using MONkEY.Notifications.Email.Triggers;

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
            var emailSubject = $"{report.AccountName} - Bericht für {report.ReportedPeriodName}";

            string transactionEntries = string.Empty;
            if (report.Transactions.Count > 0)
            {
                foreach (var transaction in report.Transactions)
                {
                    transactionEntries += string.Format(
                        "<tr><td>{0}</td><td><p><b style=\"color: {1}\">{2}€</b></td><td>{3}</td><td><i>{4}</i></td></tr>",
                        transaction.TriggeredOn,
                        transaction.Amount < 0 ? "#B71C1C" : "#388E3C",
                        transaction.Amount.ToString("+0.##;-0.##"),
                        transaction.TriggeredBy,
                        transaction.Comment ?? string.Empty);
                }
            }
            else
            {
                transactionEntries = "<p>Es gab keine Transaktionen.</p>";
            }

            var emailBody = emailSender
                .GetTemplate("body_monthly_report")
                .Replace("{{ACCOUNT_NAME}}", report.AccountName)
                .Replace("{{CLOSING_BALANCE}}", report.ClosingBalance.ToString())
                .Replace("{{STARTING_BALANCE}}", report.StartingBalance.ToString())
                .Replace("{{TRANSACTION_ENTRIES}}", transactionEntries);

            await emailSender.Send(trigger.Recipients, emailSubject, emailBody);
        }
    }
}
