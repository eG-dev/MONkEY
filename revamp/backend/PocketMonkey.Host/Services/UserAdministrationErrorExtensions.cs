namespace PocketMonkey.Host.Services;

public static class UserAdministrationErrorExtensions
{
    public static string ToCode(this UserAdministrationError error) => error switch
    {
        UserAdministrationError.InvalidUser => "invalid_user",

        UserAdministrationError.InvalidPassword => "invalid_password",

        UserAdministrationError.InvalidLanguage => "invalid_language",

        UserAdministrationError.InvalidTheme => "invalid_theme",

        UserAdministrationError.NotFound => "not_found",

        UserAdministrationError.LastManager => "last_manager",

        UserAdministrationError.AlreadyInitialized => "already_initialized",

        _ => throw new ArgumentOutOfRangeException(nameof(error), error, "Unsupported user administration error.")
    };
}