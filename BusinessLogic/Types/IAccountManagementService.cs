using MONkEY.Data.Entities;
using MONkEY.Identity.Types;

namespace MONkEY.BusinessLogic.Types
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