using System.Text.Json.Serialization;

namespace PocketMonkey.Api.Entities;

[JsonConverter(typeof(JsonStringEnumConverter<LedgerEntrySource>))]
public enum LedgerEntrySource
{
    [JsonStringEnumMemberName("opening")]
    Opening
}