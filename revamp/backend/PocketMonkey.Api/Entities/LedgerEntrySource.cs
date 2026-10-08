using System.Text.Json.Serialization;

namespace PocketMonkey.Api.Entities;

[JsonConverter(typeof(LedgerEntrySourceConverter))]
public enum LedgerEntrySource
{
    [JsonStringEnumMemberName("opening")]
    Opening,

    [JsonStringEnumMemberName("deposit")]
    Deposit,

    [JsonStringEnumMemberName("withdrawal")]
    Withdrawal
}