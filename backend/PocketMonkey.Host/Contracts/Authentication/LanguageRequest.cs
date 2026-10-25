namespace PocketMonkey.Host.Contracts.Authentication;

/// <summary>Personal presentation language, independent of business permissions.</summary>
public sealed record LanguageRequest
{
    public string Language { get; init; } = string.Empty;
}