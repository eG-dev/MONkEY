using System.Globalization;
using System.Text.Json;

var timezone = TimeZoneInfo.FindSystemTimeZoneById(Environment.GetEnvironmentVariable("TZ") ?? "UTC");
var instants = new[]
{
    "2026-03-29T00:59:59Z",
    "2026-03-29T01:00:00Z",
    "2026-10-25T00:59:59Z",
    "2026-10-25T01:00:00Z"
};
var samples = instants
    .Select(x =>
    {
        var utc = DateTimeOffset.Parse(x, CultureInfo.InvariantCulture);
        var local = TimeZoneInfo.ConvertTime(utc, timezone);

        return new
        {
            instant = x,
            local = local.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
            offsetMinutes = local.Offset.TotalMinutes
        };
    })
    .ToArray();

Console.WriteLine(JsonSerializer.Serialize(new
{
    timezone = timezone.Id,
    samples,
    englishMonth = CultureInfo.GetCultureInfo("en-GB").DateTimeFormat.MonthNames[2],
    germanMonth = CultureInfo.GetCultureInfo("de-DE").DateTimeFormat.MonthNames[2]
}));