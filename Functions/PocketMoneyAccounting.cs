using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Support;

namespace MONkEY.Functions
{
    public class PocketMoneyAccounting
    {
        private const string TRANSACTION_TRIGGER_NAME = "Taschengeld-Service";

        private readonly ILogger _logger;

        private readonly IAccountOwnerService _owners;

        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;

        public PocketMoneyAccounting(
            IAccountOwnerService owners,
            IAccountService accounts,
            ITransactionService transactions,
            ILogger<PocketMoneyAccounting> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _owners = owners ?? throw new ArgumentNullException(nameof(owners));

            _accounts = accounts ?? throw new ArgumentNullException(nameof(accounts));
            _transactions = transactions ?? throw new ArgumentNullException(nameof(transactions));
        }

        [Function("PocketMoney")]
        // Runs every day at 12:30 AM
        public async Task Run([TimerTrigger("0 30 0 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing pocket money service");

            var firstOfMonth = DateTimeOffset.UtcNow.StartOfMonth();

            var owners = await _owners.GetAllAsync();
            foreach (var ownersGroup in owners.GroupBy(x => x.TenantKey))
            {
                var tenantKey = ownersGroup.Key;

                var accounts = await _accounts.GetAllAsync(tenantKey);

                foreach (var account in accounts)
                {
                    if (account.PocketMoney.HasValue && account.PocketMoney.Value > 0)
                    {
                        var pocketMoneyTransactions = await _transactions.GetSinceAsync(account.TenantKey, account.AccountKey, firstOfMonth, TRANSACTION_TRIGGER_NAME);

                        if (pocketMoneyTransactions.Count == 0)
                        {
                            var amount = account.PocketMoney.Value;

                            await _transactions.AddAsync(new Transaction()
                            {
                                PartitionKey = account.TenantKey,
                                AccountKey = account.AccountKey,
                                TriggeredBy = TRANSACTION_TRIGGER_NAME,
                                Amount = amount,
                                Comment = "Monatliches Taschengeld",
                            });

                            account.Balance += amount;

                            await _accounts.UpdateAsync(account);
                        }
                    }
                }
            }
        }
    }
}
