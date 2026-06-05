using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

using MONkEY.Data.Entities;
using MONkEY.Data.Types;
using MONkEY.Support;

namespace MONkEY.Functions.Workers
{
    public class PocketMoneyCredit
    {
        private const string TRANSACTION_TRIGGER_NAME = "Taschengeld-Service";

        private readonly ILogger _logger;

        private readonly ITenantMemberService _owners;

        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;

        public PocketMoneyCredit(
            ITenantMemberService owners,
            IAccountService accounts,
            ITransactionService transactions,
            ILogger<PocketMoneyCredit> logger)
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
            _logger.LogInformation("Executing pocket money service");

            var firstOfMonth = DateTimeOffset.UtcNow.StartOfMonth();

            var owners = await _owners.GetAllAsync();
            foreach (var ownersGroup in owners.GroupBy(x => x.TenantKey))
            {
                var tenantKey = ownersGroup.Key;

                _logger.LogInformation("Running pocket money credit for tenant {tenantKey}",  tenantKey);

                var accounts = await _accounts.GetAllAsync(tenantKey);

                foreach (var account in accounts)
                {
                    var allowance = account.Allowance.GetValueOrDefault();

                    if (allowance > 0)
                    {
                        var pocketMoneyTransactions = await _transactions.GetSinceAsync(account.TenantKey, account.AccountKey, firstOfMonth, TRANSACTION_TRIGGER_NAME);

                        if (pocketMoneyTransactions.Count == 0)
                        {
                            _logger.LogInformation("Starting credit {Value}€ pocket money to the account {AccountKey} ({tenantKey})",
                                allowance, account.AccountKey, tenantKey);

                            await _transactions.AddAsync(new Transaction()
                            {
                                PartitionKey = account.TenantKey,
                                AccountKey = account.AccountKey,
                                TriggeredBy = TRANSACTION_TRIGGER_NAME,
                                Amount = allowance,
                                Comment = "Monatliches Taschengeld",
                            });

                            account.Balance += allowance;

                            await _accounts.UpdateAsync(account);

                            _logger.LogInformation("Successfully credited pocket money to account {AccountKey} ({tenantKey})",
                                account.AccountKey, tenantKey);
                        }
                    }
                }
            }
        }
    }
}
