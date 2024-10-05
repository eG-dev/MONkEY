using Azure.Data.Tables;
using WebApp.Models;

namespace WebApp.Services
{
    public class AccountService
    {
        private readonly TableClient _tableClient;

        public AccountService(TableClient tableClient)
        {
            _tableClient = tableClient ?? throw new ArgumentNullException(nameof(tableClient));
        }

        public IQueryable<Account> GetAll()
        {
            var accounts = _tableClient.Query<Account>();

            return accounts
                .AsQueryable();
        }

        public async Task Insert(Account account)
        {
            if (account == null) throw new ArgumentNullException(nameof(account));

            account.PartitionKey = account.Name;
            account.RowKey = Guid.NewGuid().ToString();

            await _tableClient.AddEntityAsync(account);
        }

        public async Task Update(Account account)
        {
            if (account == null) throw new ArgumentNullException(nameof(account));

            await _tableClient.UpdateEntityAsync(account, account.ETag);
        }
    }
}
