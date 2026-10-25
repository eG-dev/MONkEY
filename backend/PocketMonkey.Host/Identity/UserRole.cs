using System.Text.Json.Serialization;

namespace PocketMonkey.Host.Identity;

[JsonConverter(typeof(JsonStringEnumConverter<UserRole>))]
public enum UserRole
{
    [JsonStringEnumMemberName("Manager")]
    Manager,

    [JsonStringEnumMemberName("Member")]
    Member
}