using Azure.Data.Tables;
using System.Security.Claims;

namespace MONkEY.Data.Services
{
    public class IdentityService : IIdentityService
    {
        private const string TENANT = "klerner";
        private const string TABLE_NAME = "users";

        private readonly TableClient _tableClient;

        private KeyValuePair<string, Identity>? _cachedUser = null;

        public IdentityService(TableServiceClient tableServiceClient)
        {
            ArgumentNullException.ThrowIfNull(tableServiceClient, nameof(tableServiceClient));

            _tableClient = tableServiceClient.GetTableClient(
                tableName: TABLE_NAME
            );
        }

        public async Task<Identity?> FromPrincipal(ClaimsPrincipal principal)
        {
            if (principal != null)
            {
                var email = principal.Identity?.Name ?? string.Empty;

                //if (!_cachedUser.HasValue || _cachedUser.Value.Key != email)
                //{
                //    var user = await _tableClient.QueryAsync<Identity>(x => x.
                //}

                return new()
                {
                    Name = principal.FindFirst("name")?.Value ?? string.Empty,
                    Email = email,
                    TenantKey = TENANT,
                    IsGlobalAdmin = false,
                };
            }

            return null;
        }
    }
}
