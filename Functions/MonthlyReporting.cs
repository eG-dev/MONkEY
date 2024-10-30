using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Globalization;
using System.Text.Json;

using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Functions.DTO;
using MONkEY.Support;

namespace MONkEY.Functions
{
    public class MonthlyReporting
    {
        private const string EMAIL_SENDER_ADDRESS = "no-reply@monkey-app.de";
        private const string EMAIL_SENDER_NAME = "MONkEY App";
        private const string EMAIL_TEMPLATE_ID = "d-51be69cb71f54e2f95a3a30c3c0426d7";

        private const string TIMEZONE_ID = "Central Europe Standard Time";
        private const string CULTURE_ID = "de-DE";

        private readonly ILogger _logger;

        private readonly IAccountOwnerService _owners;

        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;
        private readonly IReportService _reports;

        private readonly SendGridClient _emailClient;

        public MonthlyReporting(
            ILoggerFactory loggerFactory,
            IAccountOwnerService owners,
            IAccountService accounts,
            ITransactionService transactions,
            IReportService reports,
            SendGridClient emailClient)
        {
            _logger = loggerFactory.CreateLogger<MonthlyReporting>();

            _owners = owners ?? throw new ArgumentNullException(nameof(owners));

            _accounts = accounts ?? throw new ArgumentNullException(nameof(accounts));
            _transactions = transactions ?? throw new ArgumentNullException(nameof(transactions));
            _reports = reports ?? throw new ArgumentNullException(nameof(reports));

            _emailClient = emailClient ?? throw new ArgumentNullException(nameof(emailClient));
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

            var reportedPeriod = utcNow.StartOfMonth().SubtractMonth();
            var reportedPeriodEnd = reportedPeriod.AddMonth();

            var owners = await _owners.GetAllAsync();

            var recipients = owners
                .Where(x => x.Role != AccountOwnerRole.Member)
                .GroupBy(x => x.TenantKey);

            foreach (var emailGroup in recipients)
            {
                var tenantKey = emailGroup.Key;

                var accounts = await _accounts.GetAllAsync(tenantKey);
                foreach (var account in accounts)
                {
                    var existingReport = await _reports.GetForPeriodAsync(tenantKey, account.AccountKey, reportedPeriod);
                    if (existingReport != null)
                    {
                        continue;
                    }

                    var previosReport = await _reports.GetForPeriodAsync(tenantKey, account.AccountKey, reportedPeriod.SubtractMonth());

                    var transactions = await _transactions.GetBetweenAsync(tenantKey, account.AccountKey, reportedPeriod, reportedPeriodEnd);

                    if (previosReport == null && transactions.Count == 0)
                    {
                        // There is no need to generate a report if there were no transactions or any previously created report.
                        // This is normally the case when the application went live in this month.
                        continue;
                    }

                    double startingBalance = previosReport?.SerializedPayload != null
                        ? JsonSerializer.Deserialize<MonthyReport>(previosReport.SerializedPayload)!.StartingBalance
                        : 0;

                    double closingBalance = startingBalance + transactions.Sum(t => t.Amount);

                    var reportPayload = new MonthyReport()
                    {
                        AccountName = account.Name,
                        ReportedPeriodName = reportedPeriod.ToString("Y", culture),
                        StartingBalance = startingBalance,
                        ClosingBalance = closingBalance,
                        Transactions = transactions.Select(x =>
                        {
                            var triggeredOn = TimeZoneInfo.ConvertTime(x.TriggeredOn, timeZone).LocalDateTime.ToString("g", culture);

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
                        PartitionKey = account.TenantKey,
                        AccountKey = account.AccountKey,
                        ReportedPeriod = reportedPeriod,
                        Type = ReportTypes.Monthly,
                        SerializedPayload = JsonSerializer.Serialize(reportPayload)
                    };

                    await _reports.AddAsync(report);

                    foreach (var recipient in emailGroup)
                    {
                        var toEmail = new EmailAddress(recipient.Email);

                        var reportMessage = MailHelper.CreateSingleTemplateEmail(fromEmail, toEmail, EMAIL_TEMPLATE_ID, reportPayload);

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
