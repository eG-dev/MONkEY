using MONkEY.Data.Entities;
using MONkEY.Identity.Types;

namespace MONkEY.BusinessLogic.Types
{
    public interface IUsageTermsService
    {
        Task<TenantMember?> Accept(User user);

        bool HasAcceptedUsageTerms(User user);
    }
}