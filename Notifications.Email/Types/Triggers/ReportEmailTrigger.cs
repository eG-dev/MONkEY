using MONkEY.Data.Types.Reporting;

namespace MONkEY.Notifications.Email.Types.Triggers
{
    public record ReportEmailTrigger : EmailTrigger
    {
        public required ReportType ReportType { get; set; }
    }
}
