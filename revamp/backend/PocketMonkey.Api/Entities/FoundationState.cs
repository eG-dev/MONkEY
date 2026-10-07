namespace PocketMonkey.Api.Entities;

public sealed class FoundationState
{
    public int Id { get; set; }

    public required string SampleId { get; set; }

    public DateTimeOffset InitializedAtUtc { get; set; }
}