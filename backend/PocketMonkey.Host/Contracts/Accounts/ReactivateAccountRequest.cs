namespace PocketMonkey.Host.Contracts.Accounts;

public sealed record ReactivateAccountRequest
{
    public string? MissedAllowancePolicy { get; init; }
}