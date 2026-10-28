using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using PocketMonkey.Host.Contracts.Recovery;

namespace PocketMonkey.Host.Services;

public static partial class FinancialSnapshotJson
{
    public const long MaximumFileBytes = 256L * 1024 * 1024;

    public static JsonSerializerOptions Options { get; } = CreateOptions();

    public static async Task<FinancialSnapshot> ReadAsync(string path, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        await using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);

        if (stream.Length > MaximumFileBytes)
        {
            throw new InvalidDataException("snapshot_invalid");
        }

        using var document = await JsonDocument.ParseAsync(stream, new JsonDocumentOptions
        {
            AllowDuplicateProperties = false,
            MaxDepth = 32
        }, cancellationToken);

        if (document.RootElement.ValueKind != JsonValueKind.Object
            || !document.RootElement.TryGetProperty("formatVersion", out var version)
            || version.ValueKind != JsonValueKind.Number
            || !version.TryGetInt32(out var formatVersion))
        {
            throw new InvalidDataException("snapshot_invalid");
        }

        if (formatVersion != FinancialSnapshotValidation.CurrentFormatVersion)
        {
            throw new InvalidDataException("snapshot_version_unsupported");
        }

        return document.RootElement.Deserialize<FinancialSnapshot>(Options)
            ?? throw new InvalidDataException("snapshot_invalid");
    }

    public static string Money(long amount)
    {
        return (amount / 100m).ToString("F2", CultureInfo.InvariantCulture);
    }

    public static long ParseMoney(string value)
    {
        if (value is null || !MoneyPattern().IsMatch(value)
            || !decimal.TryParse(value, NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture, out var amount)
            || amount < long.MinValue / 100m || amount > long.MaxValue / 100m)
        {
            throw new InvalidDataException("snapshot_invalid");
        }

        var result = (long)(amount * 100m);

        if (Money(result) != value)
        {
            throw new InvalidDataException("snapshot_invalid");
        }

        return result;
    }

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = false,
            WriteIndented = true,
            UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
            RespectNullableAnnotations = true,
            MaxDepth = 32,
            AllowDuplicateProperties = false
        };
        options.Converters.Add(new SnapshotIntegerConverter());
        options.Converters.Add(new SnapshotTimestampConverter());

        return options;
    }

    [GeneratedRegex(@"^-?(0|[1-9][0-9]*)\.[0-9]{2}$", RegexOptions.CultureInvariant)]
    private static partial Regex MoneyPattern();

    private sealed class SnapshotIntegerConverter : JsonConverter<long>
    {
        public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var text = reader.TokenType == JsonTokenType.String ? reader.GetString() : null;

            if (!long.TryParse(text, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var value)
                || value.ToString(CultureInfo.InvariantCulture) != text)
            {
                throw new JsonException("snapshot_invalid");
            }

            return value;
        }

        public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString(CultureInfo.InvariantCulture));
        }
    }

    private sealed class SnapshotTimestampConverter : JsonConverter<DateTimeOffset>
    {
        private const string Format = "yyyy-MM-dd'T'HH:mm:ss.fffffff'Z'";

        public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.String
                || !DateTimeOffset.TryParseExact(reader.GetString(), Format, CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var value))
            {
                throw new JsonException("snapshot_invalid");
            }

            return value;
        }

        public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToUniversalTime().ToString(Format, CultureInfo.InvariantCulture));
        }
    }
}