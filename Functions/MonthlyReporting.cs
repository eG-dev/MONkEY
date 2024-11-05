using Azure.Storage.Queues;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Support;

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

        private readonly QueueClient _emailsQueue;

        public MonthlyReporting(
            IAccountOwnerService owners,
            IAccountService accounts,
            ITransactionService transactions,
            IReportService reports,
            QueueServiceClient queueServiceClient,
            ILogger<MonthlyReporting> logger)
        {
            _owners = owners ?? throw new ArgumentNullException(nameof(owners));

            _accounts = accounts ?? throw new ArgumentNullException(nameof(accounts));
            _transactions = transactions ?? throw new ArgumentNullException(nameof(transactions));
            _reports = reports ?? throw new ArgumentNullException(nameof(reports));

            ArgumentNullException.ThrowIfNull(queueServiceClient, nameof(queueServiceClient));
            _emailsQueue = queueServiceClient.GetQueueClient("emails");

            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [Function("MonthlyReporting")]
        // Runs every day at 0:35
        public async Task Run([TimerTrigger("0 35 0 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing monthly reporting service");

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

                    var emailRecipients = emailGroup
                        .Where(x => x.Preferences.IsMonthlyReportingEnabled)
                        .Select(x => x.Email)
                        .ToArray();

                    if (emailRecipients.Length > 0)
                    {
                        await TriggerEmail(emailRecipients, report.SerializedPayload);
                    }
                }
            }
        }

        public async Task TriggerEmail(string[] recipients, string serializedReportPayload)
        {
            var emailTrigger = new EmailTriggerForReport()
            {
                Recipients = recipients,
                EmailType = EmailType.Report,
                ReportType = ReportType.Monthly,
                Payload = serializedReportPayload,
            };

            byte[] buffer = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(emailTrigger));

            await _emailsQueue.SendMessageAsync(Convert.ToBase64String(buffer));
        }
    }
}
