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

        public async Task<Account?> UpdateProfileImage(string accountRowKey, string imageDataBase64)
        {
            var account = await Accounts.GetByKeyAsync(accountRowKey);

            if (account != null)
            {
                if (!string.IsNullOrEmpty(account.ProfileImage))
                {
                    await Blobs.DeleteFileAsync($"{account.TenantId}/{account.ProfileImage}");
                }

                byte[] imageBytes = Convert.FromBase64String(imageDataBase64);
                var fileName = $"{FileNameGenerator.GetRandom(24)}.png";

                await Blobs.UploadFileAsync($"{account.TenantId}/{fileName}", imageBytes);

                account.ProfileImage = fileName;
                await Accounts.UpdateAsync(account);
            }

            return account;
        }
    }
}
