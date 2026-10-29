namespace PocketMonkey.Storage.Entities;

public sealed class Account
{
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public required string Name { get; set; }

    public required string NormalizedName { get; set; }

    public long? BalanceMinorUnits { get; set; }

    public string? ImageKey { get; set; }

    public DateTimeOffset? RetiredAtUtc { get; set; }

    public List<LedgerEntry> LedgerEntries { get; } = [];
}