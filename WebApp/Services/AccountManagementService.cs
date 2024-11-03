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

        public async Task<Account?> UpdateImage(Identity user, string accountKey, string imageDataBase64)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (!user.IsAllowedToManage)
            {
                throw new InvalidOperationException("User is not allowed to edit accounts!");
            }
            if (string.IsNullOrEmpty(accountKey))
            {
                throw new ArgumentException("Account key is required!", nameof(accountKey));
            }

            var account = await Accounts.GetAsync(user.TenantKey, accountKey);

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

        public async Task<Account?> Create(Identity user, string accountName)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (!user.IsAllowedToManage)
            {
                throw new InvalidOperationException("User is not allowed to create accounts!");
            }
            if (string.IsNullOrEmpty(accountName))
            {
                throw new ArgumentException("Account name is required!", nameof(accountName));
            }

            var account = await Accounts.AddAsync(new Account()
            {
                PartitionKey = user.TenantKey,
                Name = accountName,
            });

            return account;
        }

        public async Task Delete(Identity user, string accountKey)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (!user.IsAllowedToManage)
            {
                throw new InvalidOperationException("User is not allowed to delete accounts!");
            }
            if (string.IsNullOrEmpty(accountKey))
            {
                throw new ArgumentException("Account key is required!", nameof(accountKey));
            }

            var account = await Accounts.GetAsync(user.TenantKey, accountKey);

            if (account != null)
            {
                if (!string.IsNullOrEmpty(account.Image))
                {
                    await Blobs.DeleteFileAsync($"{user.TenantKey}/{account.Image}");
                }

                await Reports.DeleteAllAsync(user.TenantKey, accountKey);

                await Transactions.DeleteAllAsync(user.TenantKey, accountKey);

                await Accounts.DeleteAsync(user.TenantKey, accountKey);
            }
        }

        public async Task DeleteAll(Identity user)
        {
            ArgumentNullException.ThrowIfNull(user, nameof(user));

            if (string.IsNullOrEmpty(user.TenantKey))
            {
                throw new InvalidOperationException("User is not assigned to a tenant!");
            }
            if (!user.IsAllowedToManage)
            {
                throw new InvalidOperationException("User is not allowed to delete accounts!");
            }

            var accounts = await Accounts.GetAllAsync(user.TenantKey);

            foreach (var account in accounts)
            {
                await Delete(user, account.AccountKey);
            }
        }

        public string GetImageSrc(Account account)
        {
            return !string.IsNullOrEmpty(account?.Image)
                ? $"api/image/{account.TenantKey}/{account.Image}"
                : "images/monkey_face.png";
        }
    }
}
