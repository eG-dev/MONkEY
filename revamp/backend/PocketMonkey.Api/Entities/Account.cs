namespace PocketMonkey.Api.Entities;

public sealed class Account
{
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public required string Name { get; set; }

    public required string NormalizedName { get; set; }
}