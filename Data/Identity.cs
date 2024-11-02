using System.Diagnostics;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Name}, {Email}")]
    public class Identity
    {
        public string Name { get; init; } = string.Empty;

        public string Email { get; init; } = string.Empty;

        public string TenantKey { get; init; } = string.Empty;

        public DateTimeOffset? LastLoggedOn { get; init; }

        public DateTimeOffset? TermsAcceptedOn { get; init; }

        public AccountOwnerStatus Status { get; init; }

        public AccountOwnerRole Role { get; init; }

        public required AccountOwnerPreferences Preferences { get; init; }

        public bool IsGlobalAdmin { get => Role == AccountOwnerRole.GlobalAdmin; }

        public bool IsAllowedToManage { get => Role >= AccountOwnerRole.Manager; }

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
