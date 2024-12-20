namespace MONkEY.Notifications.Email.Triggers
{
    public class EmailTrigger
    {
        public required EmailType EmailType { get; set; }

        public string[] Recipients { get; set; } = [];

        public required string Payload { get; set; }
    }
}
