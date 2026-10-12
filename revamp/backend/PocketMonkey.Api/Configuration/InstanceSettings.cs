using System.Globalization;
using System.Net;
using Microsoft.Data.Sqlite;

namespace PocketMonkey.Api.Configuration;

public sealed record InstanceSettings
{
    public required string DataPath { get; init; }
    public required string Timezone { get; init; }
    public required string DefaultLocale { get; init; }
    public string Currency { get; init; } = "EUR";
    public LogLevel LogLevel { get; init; }

    public string ImagesPath => Path.Combine(DataPath, "images");
    public string KeysPath => Path.Combine(DataPath, "keys");
    public string ConnectionString => new SqliteConnectionStringBuilder
    {
        DataSource = Path.Combine(DataPath, "monkey.db"),
        ForeignKeys = true,
        DefaultTimeout = 5
    }.ToString();

    public static InstanceSettings Read(IConfiguration configuration, IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var dataPath = configuration["MONKEY_DATA_PATH"] ?? (environment.IsDevelopment()
            ? Path.GetFullPath(Path.Combine(environment.ContentRootPath, "../../.local/data"))
            : "/data");
        if (!Path.IsPathFullyQualified(dataPath))
        {
            throw new InvalidOperationException("MONKEY_DATA_PATH must be an absolute path.");
        }

        var timezone = configuration["TZ"] ?? "UTC";
        if (timezone != "UTC" && !TimeZoneInfo.TryConvertIanaIdToWindowsId(timezone, out _))
        {
            throw new InvalidOperationException("TZ must be a supported IANA timezone ID.");
        }
        _ = TimeZoneInfo.FindSystemTimeZoneById(timezone);

        var locale = configuration["MONKEY_DEFAULT_LOCALE"] ?? "de-DE";
        if (locale is not ("de-DE" or "en-US"))
        {
            throw new InvalidOperationException("MONKEY_DEFAULT_LOCALE must be de-DE or en-US.");
        }
        _ = CultureInfo.GetCultureInfo(locale);

        var currency = configuration["MONKEY_CURRENCY"] ?? "EUR";
        if (currency is not ("EUR" or "USD"))
        {
            throw new InvalidOperationException("MONKEY_CURRENCY must be EUR or USD.");
        }

        if (!Enum.TryParse<LogLevel>(configuration["MONKEY_LOG_LEVEL"] ?? "Information", true, out var logLevel)
            || !Enum.IsDefined(logLevel))
        {
            throw new InvalidOperationException("MONKEY_LOG_LEVEL is invalid.");
        }

        var publicUrl = configuration["MONKEY_PUBLIC_URL"];
        if (!environment.IsDevelopment() || publicUrl is not null)
        {
            if (!Uri.TryCreate(publicUrl, UriKind.Absolute, out var origin)
                || origin.UserInfo.Length != 0 || origin.AbsolutePath != "/"
                || origin.Query.Length != 0 || origin.Fragment.Length != 0
                || (origin.Scheme != "https" && !(environment.IsDevelopment() && origin.Scheme == "http")))
            {
                throw new InvalidOperationException("MONKEY_PUBLIC_URL must be an HTTPS origin in production.");
            }
        }

        foreach (var proxy in (configuration["MONKEY_TRUSTED_PROXIES"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!IPAddress.TryParse(proxy, out _) && !IPNetwork.TryParse(proxy, out _))
            {
                throw new InvalidOperationException("MONKEY_TRUSTED_PROXIES must contain IP addresses or CIDRs.");
            }
        }

        return new InstanceSettings
        {
            DataPath = dataPath,
            Timezone = timezone,
            DefaultLocale = locale,
            Currency = currency,
            LogLevel = logLevel
        };
    }

    public void PrepareStorage()
    {
        foreach (var directory in new[] { DataPath, ImagesPath, KeysPath })
        {
            var exists = Directory.Exists(directory);
            Directory.CreateDirectory(directory);
            if (!exists && !OperatingSystem.IsWindows())
            {
                File.SetUnixFileMode(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            }

            if (!OperatingSystem.IsWindows())
            {
                var publicPermissions =
                    UnixFileMode.GroupRead |
                    UnixFileMode.GroupWrite |
                    UnixFileMode.GroupExecute |
                    UnixFileMode.OtherRead |
                    UnixFileMode.OtherWrite |
                    UnixFileMode.OtherExecute;

                if ((File.GetUnixFileMode(directory) & publicPermissions) != 0)
                {
                    throw new InvalidOperationException("MONKEY_DATA_PATH and its image/key directories must have private owner-only permissions.");
                }
            }

            var probe = Path.Combine(directory, $".write-check-{Guid.NewGuid():N}");
            
            try
            {
                using var stream = new FileStream(probe, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None);
            }
            finally
            {
                File.Delete(probe);
            }
        }
    }
}