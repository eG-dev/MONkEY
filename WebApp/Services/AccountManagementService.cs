using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Support;

namespace MONkEY.WebApp.Services
{
    public class AccountManagementService
    {
        private IAccountService Accounts { get; }

        private ITransactionService Transactions { get; }

        private IReportService Reports { get; }

        private IBlobService Blobs { get; }

        public AccountManagementService(
            IAccountService accountService,
            ITransactionService transactions,
            IReportService reports,
            IBlobService blobService)
        {
            Accounts = accountService ?? throw new ArgumentNullException(nameof(accountService));
            Transactions = transactions ?? throw new ArgumentNullException(nameof(transactions));
            Reports = reports ?? throw new ArgumentNullException(nameof(reports));
            Blobs = blobService ?? throw new ArgumentNullException(nameof(blobService));
        }

        public async Task<Account?> UpdateImage(string tenantKey, string accountKey, string imageDataBase64)
        {
            var account = await Accounts.GetAsync(tenantKey, accountKey);

            if (account != null)
            {
                if (!string.IsNullOrEmpty(account.Image))
                {
                    await Blobs.DeleteFileAsync($"{account.TenantKey}/{account.Image}");
                }

                byte[] imageBytes = Convert.FromBase64String(imageDataBase64);
                var fileName = $"{FileNameGenerator.GetRandom(24)}.png";

                await Blobs.UploadFileAsync($"{account.TenantKey}/{fileName}", imageBytes);

                account.Image = fileName;
                await Accounts.UpdateAsync(account);
            }

            return account;
        }

        public async Task<Account?> CreateAccount(string tenantKey, string name)
        {
            var account = await Accounts.AddAsync(new Account()
            {
                PartitionKey = tenantKey,
                Name = name,
            });

            return account;
        }

        public async Task DeleteAccount(string tenantKey, string accountKey)
        {
            var account = await Accounts.GetAsync(tenantKey, accountKey);

            if (account != null)
            {
                if (!string.IsNullOrEmpty(account.Image))
                {
                    await Blobs.DeleteFileAsync($"{account.TenantKey}/{account.Image}");
                }

                await Reports.DeleteAllAsync(tenantKey, accountKey);

                await Transactions.DeleteAllAsync(tenantKey, accountKey);

                await Accounts.DeleteAsync(tenantKey, accountKey);
            }
        }

        public string GetAccountImageSrc(Account account)
        {
            return !string.IsNullOrEmpty(account?.Image)
                ? $"api/image/{account.TenantKey}/{account.Image}"
                : "images/monkey_face.png";
        }
    }
}
