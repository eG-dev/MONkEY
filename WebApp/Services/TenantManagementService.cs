using MONkEY.Data;
using MONkEY.Data.Services;

namespace MONkEY.WebApp.Services
{
    public class TenantManagementService
    {
        private IAccountOwnerService AccountOwners { get; }

        public TenantManagementService(
            IAccountOwnerService accountOwners)
        {
            AccountOwners = accountOwners ?? throw new ArgumentNullException(nameof(accountOwners));
        }
    }
}
