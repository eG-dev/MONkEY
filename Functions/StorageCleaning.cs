using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

using MONkEY.Data.Services;
using MONkEY.Support;

namespace MONkEY.Functions
{
    public class StorageCleaning
    {
        private const int RETENTION_MONTHS = 12;

        private readonly ILogger<StorageCleaning> _logger;

        private readonly ITenantMemberService _owners;
        private readonly ITransactionService _transactions;
        private readonly IReportService _reports;

        public StorageCleaning(
            ITenantMemberService accountOwnerService,
            ITransactionService transactionService,
            IReportService reportService,
            ILogger<StorageCleaning> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _owners = accountOwnerService ?? throw new ArgumentNullException(nameof(accountOwnerService));
            _transactions = transactionService ?? throw new ArgumentNullException(nameof(transactionService));
            _reports = reportService ?? throw new ArgumentNullException(nameof(reportService));
        }

        [Function("StorageCleaning")]
        // Runs every day at 2:00 AM
        public async Task Run([TimerTrigger("0 0 2 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation("Executing storage cleaning service");

            var currentPeriod = DateTimeOffset.UtcNow.StartOfMonth();
            var olderThanThreshold = currentPeriod.SubtractMonths(RETENTION_MONTHS);

            var tenantKeys = await _owners.GetAllTenantKeysAsync();

            foreach (var tenantKey in tenantKeys)
            {
                _logger.LogInformation("Starting cleaning up transactions in tenant {tenantKey}", tenantKey);

                await _transactions.DeleteOlderThanAsync(tenantKey, olderThanThreshold);

                _logger.LogInformation("Successfully cleaned up transactions in tenant {tenantKey}", tenantKey);

                _logger.LogInformation("Starting cleaning up reports in tenant {tenantKey}", tenantKey);

                await _reports.DeleteOlderThanAsync(tenantKey, olderThanThreshold);

                _logger.LogInformation("Successfully cleaned up reports in tenant {tenantKey}", tenantKey);
            }
        }
    }
}
