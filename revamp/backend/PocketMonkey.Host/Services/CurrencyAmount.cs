using System.Globalization;
using System.Text.RegularExpressions;

namespace PocketMonkey.Host.Services;

public static partial class CurrencyAmount
{
    public static bool TryParse(string? value, out long minorUnits)
    {
        minorUnits = 0;

        if (value is null || value.Length > 21 || !AmountPattern().IsMatch(value) ||
            !decimal.TryParse(value, NumberStyles.AllowDecimalPoint | NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var amount))
        {
            return false;
        }

        var cents = amount * 100m;

        if (cents < long.MinValue || cents > long.MaxValue)
        {
            return false;
        }

        minorUnits = checked((long)cents);

        return true;
    }

    public static string Format(long minorUnits) => (minorUnits / 100m).ToString("F2", CultureInfo.InvariantCulture);

    [GeneratedRegex(@"\A-?[0-9]{1,17}(?:\.[0-9]{1,2})?\z", RegexOptions.CultureInvariant | RegexOptions.NonBacktracking)]
    private static partial Regex AmountPattern();
}