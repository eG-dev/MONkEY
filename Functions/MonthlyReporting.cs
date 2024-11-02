using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Functions.DTO;
using MONkEY.Support;
using MONkEY.Functions.Services;

namespace MONkEY.Functions
{
    public class MonthlyReporting
    {
        private const string TIMEZONE_ID = "Central Europe Standard Time";

        private readonly ILogger _logger;

        private readonly IAccountOwnerService _owners;

        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;
        private readonly IReportService _reports;

        private readonly IEmailService _email;

        public MonthlyReporting(
            ILoggerFactory loggerFactory,
            IAccountOwnerService owners,
            IAccountService accounts,
            ITransactionService transactions,
            IReportService reports,
            IEmailService emailService)
        {
            _logger = loggerFactory.CreateLogger<MonthlyReporting>();

            _owners = owners ?? throw new ArgumentNullException(nameof(owners));

            _accounts = accounts ?? throw new ArgumentNullException(nameof(accounts));
            _transactions = transactions ?? throw new ArgumentNullException(nameof(transactions));
            _reports = reports ?? throw new ArgumentNullException(nameof(reports));

            _email = emailService ?? throw new ArgumentNullException(nameof(emailService));
        }

        [Function("MonthlyReporting")]
        // Runs every day at 0:35
        public async Task Run([TimerTrigger("0 35 0 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing monthly reporting service");

            var utcNow = DateTimeOffset.UtcNow;

            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(TIMEZONE_ID);

            var reportedPeriod = utcNow.StartOfMonth().SubtractMonth();
            var reportedPeriodEnd = reportedPeriod.AddMonth();

            var owners = await _owners.GetAllAsync();

            var recipientGroups = owners
                .Where(x => x.Role != AccountOwnerRole.Member)
                .GroupBy(x => x.TenantKey);

            foreach (var emailGroup in recipientGroups)
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
                        ReportedPeriodName = reportedPeriod.ToString("Y"),
                        StartingBalance = startingBalance,
                        ClosingBalance = closingBalance,
                        Transactions = transactions.Select(x =>
                        {
                            var triggeredOn = TimeZoneInfo.ConvertTime(x.TriggeredOn, timeZone).LocalDateTime.ToString("g");

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

                    var emailSubject = $"{reportPayload.AccountName} - Bericht für {reportPayload.ReportedPeriodName}";

                    string transactionEntries = string.Empty;
                    if (reportPayload.Transactions.Count > 0)
                    {
                        transactionEntries += "<ul>";

                        foreach (var transaction in reportPayload.Transactions)
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
                        .Replace("{{ACCOUNT_NAME}}", reportPayload.AccountName)
                        .Replace("{{CLOSING_BALANCE}}", reportPayload.ClosingBalance.ToString())
                        .Replace("{{STARTING_BALANCE}}", reportPayload.StartingBalance.ToString())
                        .Replace("{{TRANSACTION_ENTRIES}}", transactionEntries, StringComparison.Ordinal);

                    await _email.Send(emailGroup.Select(x => x.Email), emailSubject, emailBody);
                }
            }
        }
    }
}
