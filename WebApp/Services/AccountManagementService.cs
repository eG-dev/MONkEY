using MONkEY.Data;
using MONkEY.Data.Services;
using MONkEY.Support;

namespace MONkEY.WebApp.Services
{
    public class AccountManagementService
    {
        private IAccountService Accounts { get; }

        private IBlobService Blobs { get; }

        public AccountManagementService(
            IAccountService accountService,
            IBlobService blobService)
        {
            Accounts = accountService ?? throw new ArgumentNullException(nameof(accountService));
            Blobs = blobService ?? throw new ArgumentNullException(nameof(blobService));
        }

        public async Task<Account?> UpdateProfileImage(string tenant, string accountKey, string imageDataBase64)
        {
            var account = await Accounts.GetAsync(tenant, accountKey);

            if (account != null)
            {
                if (!string.IsNullOrEmpty(account.Image))
                {
                    await Blobs.DeleteFileAsync($"{account.Tenant}/{account.Image}");
                }

                byte[] imageBytes = Convert.FromBase64String(imageDataBase64);
                var fileName = $"{FileNameGenerator.GetRandom(24)}.png";

                await Blobs.UploadFileAsync($"{account.Tenant}/{fileName}", imageBytes);

                account.Image = fileName;
                await Accounts.UpdateAsync(account);
            }

            return account;
        }
    }
}
