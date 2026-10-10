namespace PocketMonkey.Api.Entities;

public sealed class AllowanceRevision
{
    public long SequenceNumber { get; set; }
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string AccountId { get; set; }
    public required string PreviousRevisionId { get; set; }
    public required string ActorId { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public int EffectiveMonth { get; set; }
    public bool Enabled { get; set; }
    public long? AmountMinorUnits { get; set; }
}