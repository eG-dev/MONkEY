using System.Diagnostics;

using MONkEY.Data;

namespace MONkEY.Identity
{
    [DebuggerDisplay("{Name}, {Email}")]
    public class User
    {
        public string Name { get; init; } = string.Empty;

        public string Email { get; init; } = string.Empty;

        public string TenantKey { get; init; } = string.Empty;

        public DateTimeOffset? LastLoggedOn { get; init; }

        public DateTimeOffset? TermsAcceptedOn { get; init; }

        public TenantMemberStatus Status { get; init; }

        public TenantMemberRole Role { get; init; }

        public required TenantMemberPreferences Preferences { get; init; }

        public bool IsGlobalAdmin { get => Role == TenantMemberRole.GlobalAdmin; }

        public bool IsAllowedToManage { get => Role >= TenantMemberRole.Manager; }

        public override string ToString()
        {
            if (!string.IsNullOrEmpty(Name))
            {
                return Name;
            }

            if (!string.IsNullOrEmpty(Email))
            {
                return Email;
            }

            return string.Empty;
        }
    }
}
