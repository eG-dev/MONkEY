using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using MONkEY.Data.Models;
using MONkEY.Data.Services;

namespace MONkEY.Functions
{
    public class PocketMoney
    {
        private readonly ILogger _logger;
        private readonly AccountService _accounts;
        private readonly TransactionService _transactions;

        public PocketMoney(ILoggerFactory loggerFactory, AccountService accounts, TransactionService transactions)
        {
            _logger = loggerFactory.CreateLogger<PocketMoney>();

            _accounts = accounts;
            _transactions = transactions;
        }

        [Function("PocketMoney")]
        //public async Task Run([TimerTrigger("0 30 0 1 * *", RunOnStartup = true)] TimerInfo timer)
        public async Task Run([TimerTrigger("0 0 * * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing automatic balance update");

            var accounts = await _accounts.GetAllAsync();

            foreach (var account in accounts)
            {
                if (account.PocketMoney.HasValue && account.PocketMoney.Value > 0)
                {
                    var amount = account.PocketMoney.Value;

                    await _transactions.InsertAsync(new Transaction()
                    {
                        Recipient = account!.Name,
                        TriggedBy = "Taschengeld-Service",
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
