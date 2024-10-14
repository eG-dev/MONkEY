using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

using MONkEY.Data;
using MONkEY.Data.Services;

namespace MONkEY.Functions
{
    public class PocketMoney
    {
        private const string TRANSACTION_TRIGGER_NAME = "Taschengeld-Service";

        private readonly ILogger _logger;

        private readonly IAccountService _accounts;
        private readonly ITransactionService _transactions;

        public PocketMoney(ILoggerFactory loggerFactory, IAccountService accounts, ITransactionService transactions)
        {
            _logger = loggerFactory.CreateLogger<PocketMoney>();

            _accounts = accounts;
            _transactions = transactions;
        }

        [Function("PocketMoney")]
        // Runs every day at 0:30
        public async Task Run([TimerTrigger("0 30 0 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing pocket money service");

            var utcNow = DateTime.UtcNow;
            var firstOfMonth = new DateTimeOffset(utcNow.Year, utcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);

            var accounts = await _accounts.GetAllAsync();

            foreach (var account in accounts)
            {
                if (account.PocketMoney.HasValue && account.PocketMoney.Value > 0)
                {
                    var pocketMoneyTransactions = await _transactions.GetSinceAsync(account.Name,firstOfMonth, TRANSACTION_TRIGGER_NAME);

                    if (pocketMoneyTransactions.Count == 0)
                    {
                        var amount = account.PocketMoney.Value;

                        await _transactions.AddAsync(new Transaction()
                        {
                            Recipient = account!.Name,
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
