using Azure;
using Azure.Data.Tables;
using MONkEY.Data.Types;
using System.Diagnostics;
using System.Runtime.Serialization;
using System.Text.Json;

namespace MONkEY.Data.Entities
{
    [DebuggerDisplay("{TenantKey}, {Email}")]
    public class TenantMember : ITableEntity
    {
        private TenantMemberPreferences? _preferences = null;

        public string PartitionKey { get; set; } = default!;

        public string RowKey { get; set; } = default!;

        [IgnoreDataMember]
        public string TenantKey { get => PartitionKey; }

        [IgnoreDataMember]
        public string Email { get => RowKey; }

        public TenantMemberStatus Status { get; set; } = TenantMemberStatus.Pending;

        public TenantMemberRole Role { get; set; } = TenantMemberRole.Manager;

        public DateTimeOffset? LastLoggedOn { get; set; }

        public DateTimeOffset? TermsAcceptedOn { get; set; }

        public string? StoredPreferences { get; set; }

        [IgnoreDataMember]
        public TenantMemberPreferences Preferences
        {
            get
            {
                if (_preferences == null && !string.IsNullOrEmpty(StoredPreferences))
                {
                    _preferences = JsonSerializer.Deserialize<TenantMemberPreferences>(StoredPreferences);
                }

                _preferences ??= new TenantMemberPreferences();

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
