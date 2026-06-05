using System.Text.Json;
using MONkEY.Data.Types.Reporting;
using MONkEY.Notifications.Email.Types;
using MONkEY.Notifications.Email.Types.Triggers;
using MONkEY.Support;

namespace MONkEY.Notifications.Email.Services
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

                default:
                    throw new NotSupportedException($"Report type '{trigger.ReportType}' is not supported.");
            }
        }

        private async Task SendMonthlyReport(IEmailSenderService emailSender, ReportEmailTrigger trigger, MonthlyReportPayload report)
        {
            var emailSubject = $"{report.AccountName} - Monatsbericht für {report.ReportedPeriodName}";

            var emailModel = new
            {
                account_name = report.AccountName ?? string.Empty,
                reported_period_name = report.ReportedPeriodName ?? string.Empty,
                closing_balance = AmountUtils.FormatValue(report.ClosingBalance),
                starting_balance = AmountUtils.FormatValue(report.StartingBalance),
                transactions = report.Transactions.ConvertAll(transaction => new
                {
                    triggered_on = transaction.TriggeredOn ?? string.Empty,
                    triggered_by = transaction.TriggeredBy ?? string.Empty,
                    amount = AmountUtils.FormatValue(transaction.Amount),
                    comment = transaction.Comment
                })
            };

            var emailBody = await _templateRenderer.RenderAsync("body_monthly_report", emailModel);

            await emailSender.Send(trigger.Recipients, emailSubject, emailBody);
        }
    }
}
