using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using MONkEY.Data.Models;
using MONkEY.Data.Services;

namespace MONkEY.Functions
{
    public class BalanceUpdater
    {
        private readonly ILogger _logger;
        private readonly AccountService _accounts;
        private readonly TransactionService _transactions;

        public BalanceUpdater(ILoggerFactory loggerFactory, AccountService accounts, TransactionService transactions)
        {
            _logger = loggerFactory.CreateLogger<BalanceUpdater>();

            _accounts = accounts;
            _transactions = transactions;
        }

        [Function("BalanceUpdater")]
        //public async Task Run([TimerTrigger("0 30 0 1 * *", RunOnStartup = true)] TimerInfo timer)
        public async Task Run([TimerTrigger("0 0 * * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing automatic balance update");

            var accounts = await _accounts.GetAllAsync();

            foreach (var account in accounts)
            {
                var amount = 100.0;

                await _transactions.InsertAsync(new Transaction()
                {
                    Recipient = account!.Name,
                    TriggedBy = "Taschengeld-Service",
                    Amount = amount,
                    Comment = "Automatische monatliche Einzahlung",
                });

                account.Balance += amount;

                await _accounts.UpdateAsync(account);
            }
        }
    }
}
