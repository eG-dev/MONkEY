using System.Text.Json.Serialization;

namespace PocketMonkey.Storage.Entities;

[JsonConverter(typeof(LedgerEntrySourceConverter))]
public enum LedgerEntrySource
{
    [JsonStringEnumMemberName("opening")]
    Opening,

    [JsonStringEnumMemberName("deposit")]
    Deposit,

    [JsonStringEnumMemberName("withdrawal")]
    Withdrawal,

    [JsonStringEnumMemberName("allowance")]
    Allowance
}