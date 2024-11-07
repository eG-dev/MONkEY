using MONkEY.Data;
using MONkEY.Identity;

namespace MONkEY.BusinessLogic.Services
{
    public interface IUsageTermsService
    {
        Task<AccountOwner?> Accept(User user);

        bool HasAcceptedUsageTerms(User user);
    }
}