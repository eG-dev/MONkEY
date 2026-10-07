namespace PocketMonkey.Api.Entities;

public sealed class AuditEvent
{
    public long Id { get; set; }

    public DateTimeOffset OccurredAtUtc { get; set; }

    public required string ActorId { get; set; }

    public required string SubjectId { get; set; }

    public required string Action { get; set; }
}