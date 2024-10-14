using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Globalization;
using System.Text.Json;

using MONkEY.Data.Services;
using MONkEY.Functions.DTO;
using MONkEY.Data.Models;
using MONkEY.Support;

namespace MONkEY.Functions
{
    public class MonthlyReporting
    {
        private const string EMAIL_SENDER_ADDRESS = "monkey-app@outlook.com";
        private const string EMAIL_SENDER_NAME = "MONkEY App";
        private const string EMAIL_TEMPLATE_ID = "d-51be69cb71f54e2f95a3a30c3c0426d7";

        private const string TIMEZONE_ID = "Central Europe Standard Time";
        private const string CULTURE_ID = "de-DE";

        private readonly List<string> _recipients =
        [
            "e.klerner@outlook.com",
            "c.klerner@outlook.com"
        ];

        private readonly ILogger _logger;

        private readonly AccountService _accounts;
        private readonly TransactionService _transactions;
        private readonly ReportService _reports;

        private readonly SendGridClient _emailClient;

        public MonthlyReporting(ILoggerFactory loggerFactory, AccountService accounts, TransactionService transactions, ReportService reports, SendGridClient emailClient)
        {
            _logger = loggerFactory.CreateLogger<MonthlyReporting>();

            _accounts = accounts;
            _transactions = transactions;
            _reports = reports;

            _emailClient = emailClient;
        }

        [Function("MonthlyReporting")]
        // Runs every day at 0:35
        public async Task Run([TimerTrigger("0 35 0 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing monthly reporting service");

            var fromEmail = new EmailAddress(EMAIL_SENDER_ADDRESS, EMAIL_SENDER_NAME);

            var utcNow = DateTimeOffset.UtcNow;

            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(TIMEZONE_ID);
            var culture = CultureInfo.CreateSpecificCulture(CULTURE_ID);

            var reportedPeriod = utcNow.StartOfMonth();
            var reportedPeriodEnd = reportedPeriod.ToNextMonth();

            var accounts = await _accounts.GetAllAsync();
            foreach (var account in accounts)
            {
                var reports = await _reports.GetForPeriodAsync(account.Name, reportedPeriod);

                if (reports.Count == 0)
                {
                    var transactions = await _transactions.GetBetweenAsync(account.Name, reportedPeriod, reportedPeriodEnd);

                    var reportPayload = new MonthyReport()
                    {
                        AccountName = account.Name,
                        ReportedPeriodName = reportedPeriod.ToString("Y", culture),
                        Balance = account.Balance,
                        Transactions = transactions.Select(x =>
                        {
                            var triggeredOn = TimeZoneInfo.ConvertTime(x.TriggeredOn, timeZone).LocalDateTime.ToString("o", culture);

                            return new ReportTransaction()
                            {
                                Amount = x.Amount,
                                TriggeredOn = triggeredOn,
                                TriggeredBy = x.TriggeredBy,
                            };
                        }).ToList()
                    };

                    var report = new Report()
                    {
                        AccountName = account.Name,
                        ReportedPeriod = reportedPeriod,
                        SerializedPayload = JsonSerializer.Serialize(reportPayload)
                    };

                    await _reports.AddAsync(report);

                    foreach (var recipient in _recipients)
                    {
                        var toEmail = new EmailAddress(recipient);

                        // Here we make sure that the stored payload can be properly deserialized.
                        var messagePayload = JsonSerializer.Deserialize<MonthyReport>(report.SerializedPayload);
                        var reportMessage = MailHelper.CreateSingleTemplateEmail(fromEmail, toEmail, EMAIL_TEMPLATE_ID, messagePayload);

                        var result = await _emailClient.SendEmailAsync(reportMessage);
                        if (!result.IsSuccessStatusCode)
                        {
                            _logger.LogError("Failed to send monthly report!");
                        }
                    }
                }
            }
        }
    }
}
