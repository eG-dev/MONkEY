namespace MONkEY.Functions.DTO
{
    public class SmtpSettings
    {
        public string Host { get; init; } = default!;

        public int Port { get; init; } = default!;

        public string User { get; init; } = default!;

        public string Password { get; init; } = default!;

        public string SenderName { get; init; } = default!;

        public string SenderEmail { get; init; } = default!;
    }
}
