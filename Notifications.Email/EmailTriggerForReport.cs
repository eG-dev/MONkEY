using MONkEY.Data;

namespace MONkEY.Notifications.Email
{
    public class EmailTriggerForReport : EmailTrigger
    {
        public required ReportType ReportType { get; set; }
    }
}
