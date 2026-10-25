using System.Text.Json;
using System.Text.Json.Serialization;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Identity;

namespace PocketMonkey.Host.Contracts.Users;

public sealed class UserRoleRequestConverter : JsonConverter<UserRole?>
{
    public override UserRole? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.String)
        {
            throw new JsonException("User role must be a string.");
        }

        return UserRoleNames.Parse(reader.GetString());
    }

    public override void Write(Utf8JsonWriter writer, UserRole? value, JsonSerializerOptions options)
    {
        if (value is { } role)
        {
            writer.WriteStringValue(role.ToIdentityName());
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}