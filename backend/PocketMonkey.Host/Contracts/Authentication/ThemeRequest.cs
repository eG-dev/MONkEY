namespace PocketMonkey.Host.Contracts.Authentication;

/// <summary>Personal color theme: follow the device, or always light or dark.</summary>
public sealed record ThemeRequest
{
    public string Theme { get; init; } = string.Empty;
}
