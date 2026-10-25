namespace PocketMonkey.Host.Services;

public enum UserAdministrationError
{
    InvalidUser,
    InvalidPassword,
    InvalidLanguage,
    InvalidTheme,
    NotFound,
    LastManager,
    AlreadyInitialized
}