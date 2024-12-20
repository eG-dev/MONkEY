using MONkEY.Data;

namespace MONkEY.Notifications.Email.Triggers
{
    public class ReportEmailTrigger : EmailTrigger
    {
        public required ReportType ReportType { get; set; }
    }
}
