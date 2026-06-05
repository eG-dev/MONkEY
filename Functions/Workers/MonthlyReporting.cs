using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

using MONkEY.Data.Entities;
using MONkEY.Data.Types;
using MONkEY.Data.Types.Reporting;
using MONkEY.Notifications.Email.Types;
using MONkEY.Support;

namespace MONkEY.Functions.Workers
{
    public class MonthlyReporting
    {
        private const string TIMEZONE_ID = "Central Europe Standard Time";

        private readonly TimeZoneInfo _timeZone = TimeZoneInfo.FindSystemTimeZoneById(TIMEZONE_ID);

        private readonly ILogger _logger;

        private readonly ITenantMemberService _owners;
        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;
        private readonly IReportService _reports;

        private readonly IEmailTriggerService _emails;

        public MonthlyReporting(
            ITenantMemberService accountOwnerService,
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

            var tenantMemberGroups = owners
                .Where(x =>
                    x.Role >= TenantMemberRole.Manager &&
                    x.Status == TenantMemberStatus.Active)
                .GroupBy(x => x.TenantKey);

            foreach (var tenantMembers in tenantMemberGroups)
            {
                var tenantKey = tenantMembers.Key;

                _logger.LogInformation("Running monthly reporting for tenant {tenantKey}.", tenantKey);

                var accounts = await _accounts.GetAllAsync(tenantKey);
                if (accounts.Count == 0)
                {
                    _logger.LogInformation("Skipped monthly report creation for tenant {tenantKey} for the period {reportedPeriod}. No accounts found.",
                        tenantKey, reportedPeriod);
                    continue;
                }

                var existingReports = await _reports.GetForPeriodAsync(tenantKey, reportedPeriod, ReportType.Monthly);

                if (accounts.All(accounts => existingReports.Any(x => x.AccountKey == accounts.AccountKey)))
                {
                    _logger.LogInformation("Skipped monthly report creation for tenant {tenantKey} for the period {reportedPeriod}. All reports already exist.",
                        tenantKey, reportedPeriod);
                    continue;
                }

                foreach (var account in accounts)
                {
                    if (existingReports.Any(x => x.AccountKey == account.AccountKey))
                    {
                        _logger.LogInformation("Skipped monthly report for {AccountKey} ({tenantKey}) for the period {reportedPeriod}. Report already exists.",
                            account.AccountKey, tenantKey, reportedPeriod);
                        continue;
                    }

                    _logger.LogInformation("Starting creation of monthly report for {AccountKey} ({tenantKey}) for the period {reportedPeriod}",
                        account.AccountKey, tenantKey, reportedPeriod);

                    var latestReport = await _reports.GetLatestAsync(tenantKey, account.AccountKey, ReportType.Monthly);
                    var transactions = await _transactions.GetBetweenAsync(tenantKey, account.AccountKey, reportedPeriod, reportedPeriodEnd);

                    if (latestReport == null && transactions.Count == 0)
                    {
                        // There is no need to generate a report if there were no transactions and no historical reports.
                        // This is normally the case when the account was created in the current month.
                        _logger.LogInformation("Skipped monthly report for newly created account {AccountKey} ({tenantKey}) for the period {reportedPeriod}.",
                            account.AccountKey, tenantKey, reportedPeriod);
                        continue;
                    }

                    double startingBalance = 0;
                    if (!string.IsNullOrEmpty(latestReport?.SerializedPayload))
                    {
                        var latestPayload = JsonSerializer.Deserialize<MonthlyReportPayload>(latestReport.SerializedPayload);
                        startingBalance = latestPayload!.ClosingBalance;
                    }

                    double monthlyIncome = transactions.Sum(x => x.Amount);
                    double closingBalance = startingBalance + monthlyIncome;

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

                    _logger.LogInformation("Successfully created monthly report for {AccountKey} ({tenantKey}) for the period {reportedPeriod}.",
                        account.AccountKey, tenantKey, reportedPeriod);

                    var emailRecipients = tenantMembers
                        .Where(x => x.Preferences.IsMonthlyReportingEnabled)
                        .Select(x => x.Email)
                        .ToArray();

                    if (emailRecipients.Length > 0)
                    {
                        _logger.LogInformation("Sending out email to {Length} recipients in the tenant {tenantKey}.", emailRecipients.Length, tenantKey);

                        await _emails.TriggerMonthlyReport(emailRecipients, report.SerializedPayload);
                    }
                }
            }
        }
    }
}
