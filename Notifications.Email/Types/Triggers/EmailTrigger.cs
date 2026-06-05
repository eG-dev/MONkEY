namespace MONkEY.Notifications.Email.Types.Triggers
{
    public record EmailTrigger
    {
        public required EmailType EmailType { get; set; }

        public string[] Recipients { get; set; } = [];

        public required string Payload { get; set; }
    }
}
