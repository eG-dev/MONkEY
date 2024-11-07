using MONkEY.Data;
using MONkEY.Identity;

namespace MONkEY.BusinessLogic.Services
{
    public interface IAccountManagementService
    {
        Task<Account?> Create(User user, string accountName);

        Task Delete(User user, string accountKey);

        Task DeleteAll(User user);

        string GetImageSrc(Account account);

        Task<Account?> UpdateImage(User user, string accountKey, string imageDataBase64);
    }
}