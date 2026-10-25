using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.Endpoints;

internal static class EndpointErrors
{
    public static IResult ToResult(UserAdministrationError error) =>
        TypedResults.Json(
            new { code = error.ToCode() },
            statusCode: error switch
            {
                UserAdministrationError.NotFound => StatusCodes.Status404NotFound,

                UserAdministrationError.LastManager or
                UserAdministrationError.AlreadyInitialized => StatusCodes.Status409Conflict,

                UserAdministrationError.InvalidUser or
                UserAdministrationError.InvalidPassword or
                UserAdministrationError.InvalidLanguage or
                UserAdministrationError.InvalidTheme => StatusCodes.Status400BadRequest,

                _ => throw new ArgumentOutOfRangeException(nameof(error), error, "Unsupported user administration error.")
            });
}