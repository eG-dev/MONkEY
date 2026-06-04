using System.Text.Json;

using MONkEY.Data;
using MONkEY.Notifications.Email.Services;
using MONkEY.Notifications.Email.Triggers;
using MONkEY.Notifications.Email.ViewModels;
using MONkEY.Support;

namespace MONkEY.Notifications.Email.Handler
{
    public class ReportEmailTriggerHandler : IEmailTriggerHandler<ReportEmailTrigger>
    {
        private readonly ITemplateRenderer _templateRenderer;

        public ReportEmailTriggerHandler(ITemplateRenderer templateRenderer)
        {
            _templateRenderer = templateRenderer ?? throw new ArgumentNullException(nameof(templateRenderer));
        }

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

        private async Task SendMonthlyReport(IEmailSenderService emailSender, ReportEmailTrigger trigger, MonthlyReportPayload report)
        {
            var emailSubject = $"{report.AccountName} - Monatsbericht für {report.ReportedPeriodName}";

            // Build view model for template rendering
            var transactionModels = report.Transactions.ConvertAll(transaction => new TransactionEntryModel
            {
                TriggeredOn = transaction.TriggeredOn ?? string.Empty,
                TriggeredBy = transaction.TriggeredBy ?? string.Empty,
                Amount = AmountUtils.FormatValue(transaction.Amount),
                Comment = transaction.Comment
            });

            var emailModel = new MonthlyReportEmailModel
            {
                AccountName = report.AccountName ?? string.Empty,
                ReportedPeriodName = report.ReportedPeriodName ?? string.Empty,
                ClosingBalance = AmountUtils.FormatValue(report.ClosingBalance),
                StartingBalance = AmountUtils.FormatValue(report.StartingBalance),
                Transactions = transactionModels
            };

            // Render template with model
            var emailBody = await _templateRenderer.RenderAsync("body_monthly_report", emailModel);

            await emailSender.Send(trigger.Recipients, emailSubject, emailBody);
        }
    }
}
