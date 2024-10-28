using System.Diagnostics;

namespace MONkEY.Data
{
    [DebuggerDisplay("{Name}, {Email}")]
    public class Identity
    {
        public string Name { get; init; } = default!;

        public string Email { get; init; } = default!;

        public string TenantKey { get; init; } = default!;

        public bool IsGlobalAdmin { get; init; } = default!;

        public bool IsKnown()
        {
            return !string.IsNullOrEmpty(Email);
        }

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
