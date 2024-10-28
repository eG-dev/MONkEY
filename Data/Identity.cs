using System.Diagnostics;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Name}, {Email}")]
    public class Identity
    {
        public string Name { get; init; } = string.Empty;

        public string Email { get; init; } = string.Empty;

        public string TenantKey { get; init; } = string.Empty;

        public bool IsEnabled { get; init; } = false;

        public bool IsGlobalAdmin { get; init; } = false;

        public bool IsKnown { get => !string.IsNullOrEmpty(Email); }

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
