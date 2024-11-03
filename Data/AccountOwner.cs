using Azure;
using Azure.Data.Tables;
using System.Diagnostics;
using System.Runtime.Serialization;
using System.Text.Json;

namespace MONkEY.Data
{
    [DebuggerDisplay("{TenantKey}, {Email}")]
    public class AccountOwner : ITableEntity
    {
        private AccountOwnerPreferences? _preferences = null;

        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string Email { get => PartitionKey; }

        [IgnoreDataMember]
        public string TenantKey { get => RowKey; }

        public AccountOwnerStatus Status { get; set; } = AccountOwnerStatus.Pending;

        public AccountOwnerRole Role { get; set; } = AccountOwnerRole.Manager;

        public DateTimeOffset? LastLoggedOn { get; set; }

        public DateTimeOffset? TermsAcceptedOn { get; set; }

        public string? StoredPreferences { get; set; }

        [IgnoreDataMember]
        public AccountOwnerPreferences Preferences
        {
            get
            {
                if (_preferences == null && !string.IsNullOrEmpty(StoredPreferences))
                {
                    _preferences = JsonSerializer.Deserialize<AccountOwnerPreferences>(StoredPreferences);
                }

                _preferences ??= new AccountOwnerPreferences();

                return _preferences;
            }
            set
            {
                _preferences = value;

                if (_preferences != null)
                {
                    StoredPreferences = JsonSerializer.Serialize(_preferences);
                }
                else
                {
                    StoredPreferences = null;
                }
            }
        }

        public ETag ETag { get; set; } = default!;

        public DateTimeOffset? Timestamp { get; set; } = default!;
    }
}
