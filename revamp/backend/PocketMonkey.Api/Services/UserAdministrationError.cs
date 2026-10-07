namespace PocketMonkey.Api.Services;

public enum UserAdministrationError
{
    InvalidUser,
    InvalidPassword,
    InvalidLanguage,
    NotFound,
    LastManager,
    AlreadyInitialized
}