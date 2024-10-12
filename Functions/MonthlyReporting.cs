using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using MONkEY.Data.Services;
using MONkEY.Functions.DTO;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Globalization;

namespace MONkEY.Functions
{
    public class MonthlyReporting
    {
        private const string EMAIL_SENDER_ADDRESS = "monkey-app@outlook.com";
        private const string EMAIL_SENDER_NAME = "MONkEY App";

        private readonly List<string> _recipients =
        [
            "e.klerner@outlook.com",
            "c.klerner@outlook.com"
        ];

        private readonly ILogger _logger;

        private readonly AccountService _accounts;
        private readonly TransactionService _transactions;

        private readonly SendGridClient _emailClient;

        public MonthlyReporting(ILoggerFactory loggerFactory, AccountService accounts, TransactionService transactions, SendGridClient emailClient)
        {
            _logger = loggerFactory.CreateLogger<MonthlyReporting>();

            _accounts = accounts;
            _transactions = transactions;

            _emailClient = emailClient;
        }

        [Function("MonthlyReporting")]
        public async Task Run([TimerTrigger("0 0 2 * * *", RunOnStartup = true)] TimerInfo timer)
        {
            _logger.LogInformation($"Executing monthly reporting service");

            var utcNow = DateTime.UtcNow;
            var firstOfMonth = new DateTimeOffset(utcNow.Year, utcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);

            var accounts = await _accounts.GetAllAsync();

            var from = new EmailAddress(EMAIL_SENDER_ADDRESS, EMAIL_SENDER_NAME);

            foreach (var account in accounts)
            {
                var transactions = await _transactions.GetNewerThanAsync(account.Name, firstOfMonth);

                var data = new MonthyReportData()
                {
                    AccountName = account.Name,
                    PeriodName = utcNow.ToString("Y", CultureInfo.CreateSpecificCulture("de-DE")),
                    Balance = account.Balance,
                    Transactions = transactions.Select(x => new ReportTransaction()
                        {
                            Amount = x.Amount,
                            TriggeredBy = x.TriggedBy,
                            Timestamp = x.Timestamp,
                        }).ToList()
                };

                foreach (var toEmail in _recipients)
                {
                    var msg = MailHelper.CreateSingleTemplateEmail(from, new EmailAddress(toEmail), "d-51be69cb71f54e2f95a3a30c3c0426d7", data);

                    await _emailClient.SendEmailAsync(msg);
                }
            }
        }
    }
}
