using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Support;
using MONkEY.Notifications.Email.Services;

namespace MONkEY.Functions
{
    public class MonthlyReporting
    {
        private const string TIMEZONE_ID = "Central Europe Standard Time";

        private readonly TimeZoneInfo _timeZone = TimeZoneInfo.FindSystemTimeZoneById(TIMEZONE_ID);

        private readonly ILogger _logger;

        private readonly IAccountOwnerService _owners;
        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;
        private readonly IReportService _reports;

        private readonly IEmailTriggerService _emails;

        public MonthlyReporting(
            IAccountOwnerService accountOwnerService,
            IAccountService accountService,
            ITransactionService transactionService,
            IReportService reportService,
            IEmailTriggerService emailTriggerService,
            ILogger<MonthlyReporting> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _owners = accountOwnerService ?? throw new ArgumentNullException(nameof(accountOwnerService));
            _accounts = accountService ?? throw new ArgumentNullException(nameof(accountService));
            _transactions = transactionService ?? throw new ArgumentNullException(nameof(transactionService));
            _reports = reportService ?? throw new ArgumentNullException(nameof(reportService));

            _emails = emailTriggerService ?? throw new ArgumentNullException(nameof(emailTriggerService));
        }

        [Function("MonthlyReporting")]
        // Runs every day at 12:35 AM
        public async Task Run([TimerTrigger("0 35 0 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation("Executing monthly reporting service");

            var reportedPeriod = DateTimeOffset.UtcNow.StartOfMonth().SubtractMonth();
            var reportedPeriodEnd = reportedPeriod.AddMonth();

            var owners = await _owners.GetAllAsync();

            var recipientGroups = owners
                .Where(x =>
                    x.Role >= AccountOwnerRole.Manager &&
                    x.Status == AccountOwnerStatus.Active)
                .GroupBy(x => x.TenantKey);

            foreach (var emailGroup in recipientGroups)
            {
                var tenantKey = emailGroup.Key;

                _logger.LogInformation("Running monthly reporting for tenant {tenantKey}", tenantKey);

                var accounts = await _accounts.GetAllAsync(tenantKey);

                foreach (var account in accounts)
                {
                    var existingReport = await _reports.GetForPeriodAsync(tenantKey, account.AccountKey, reportedPeriod, ReportType.Monthly);
                    if (existingReport != null)
                    {
                        await _emails.TriggerMonthlyReport(["e.klerner@outlook.com"], existingReport.SerializedPayload);

                        continue;
                    }

                    _logger.LogInformation("Starting creation of monthly report for {AccountKey} ({tenantKey}) for the period {reportedPeriod}",
                        account.AccountKey, tenantKey, reportedPeriod);

                    var previosReport = await _reports.GetForPeriodAsync(tenantKey, account.AccountKey, reportedPeriod.SubtractMonth(), ReportType.Monthly);

                    var transactions = await _transactions.GetBetweenAsync(tenantKey, account.AccountKey, reportedPeriod, reportedPeriodEnd);

                    if (previosReport == null && transactions.Count == 0)
                    {
                        // There is no need to generate a report if there were no transactions or any previously created report.
                        // This is normally the case when the application went live in this month.
                        continue;
                    }

                    double startingBalance = previosReport?.SerializedPayload != null
                        ? JsonSerializer.Deserialize<MonthlyReportPayload>(previosReport.SerializedPayload)!.StartingBalance
                        : 0;

                    double closingBalance = startingBalance + transactions.Sum(t => t.Amount);

                    var reportPayload = new MonthlyReportPayload()
                    {
                        AccountName = account.Name,
                        ReportedPeriodName = reportedPeriod.ToString("Y"),
                        StartingBalance = startingBalance,
                        ClosingBalance = closingBalance,
                        Transactions = transactions.Select(x =>
                        {
                            var triggeredOn = TimeZoneInfo.ConvertTime(x.TriggeredOn, _timeZone).LocalDateTime.ToString("g");

                            return new ReportTransaction()
                            {
                                Amount = x.Amount,
                                TriggeredOn = triggeredOn,
                                TriggeredBy = x.TriggeredBy,
                                Comment = x.Comment,
                            };
                        }).ToList()
                    };

                    var report = new Report()
                    {
                        PartitionKey = account.TenantKey,
                        AccountKey = account.AccountKey,
                        ReportedPeriod = reportedPeriod,
                        Type = ReportType.Monthly,
                        SerializedPayload = JsonSerializer.Serialize(reportPayload)
                    };

                    await _reports.AddAsync(report);

                    _logger.LogInformation("Successfully created monthly report for {AccountKey} ({tenantKey}) for the period {reportedPeriod}",
                        account.AccountKey, tenantKey, reportedPeriod);

                    var emailRecipients = emailGroup
                        .Where(x => x.Preferences.IsMonthlyReportingEnabled)
                        .Select(x => x.Email)
                        .ToArray();

                    if (emailRecipients.Length > 0)
                    {
                        _logger.LogInformation("Sending out email to {Length} recipients in the tenant {tenantKey}", emailRecipients.Length, tenantKey);

                        await _emails.TriggerMonthlyReport(emailRecipients, report.SerializedPayload);
                    }
                }
            }
        }
    }
}
