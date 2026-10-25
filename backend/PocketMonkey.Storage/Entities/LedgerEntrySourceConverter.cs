using System.Text.Json.Serialization;

namespace PocketMonkey.Storage.Entities;

public sealed class LedgerEntrySourceConverter : JsonStringEnumConverter<LedgerEntrySource>
{
    public LedgerEntrySourceConverter() : base(allowIntegerValues: false)
    {
    }
}