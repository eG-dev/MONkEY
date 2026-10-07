namespace PocketMonkey.Api.Contracts.Foundation;

public sealed record FoundationResponse
{
	public required string SampleId { get; init; }

	public DateTimeOffset InitializedAtUtc { get; init; }

	public required string Timezone { get; init; }
}