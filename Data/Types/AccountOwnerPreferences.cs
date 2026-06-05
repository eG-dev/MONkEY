namespace MONkEY.Data.Types
{
    public record TenantMemberPreferences
    {
        public bool IsMonthlyReportingEnabled { get; set; } = false;
    }
}
