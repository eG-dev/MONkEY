using System.Security.Claims;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Identity;
using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.Endpoints;

public static class AccountImageEndpoints
{
    public static void MapAccountImages(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);
        var images = app.MapGroup("/api/accounts/{id}/image")
            .RequireAuthorization("ReadyUser")
            .WithTags("Account images");

        images.MapGet("", async Task<IResult> (string id, ClaimsPrincipal principal, AccountImages service, HttpContext context, CancellationToken cancellationToken) =>
            {
                context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                var stream = await service.OpenAsync(id, cancellationToken, AccountReadAccess.MemberId(principal));

                return stream is null ? Error("not_found") : Results.Stream(stream, "image/png");
            })
            .WithName("ReadAccountImage")
            .Produces(StatusCodes.Status200OK, contentType: "image/png")
            .Produces(StatusCodes.Status404NotFound);

        images.MapPut("", async Task<IResult> (string id, ClaimsPrincipal principal, HttpRequest request, AccountImages service,
            CancellationToken cancellationToken) =>
            {
                var error = await service.ReplaceAsync(id, principal.FindFirstValue(ClaimTypes.NameIdentifier)!, request, cancellationToken);

                return error is null ? TypedResults.NoContent() : Error(error);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("ReplaceAccountImage")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status413PayloadTooLarge)
            .Produces(StatusCodes.Status503ServiceUnavailable);

        images.MapDelete("", async Task<IResult> (string id, ClaimsPrincipal principal, AccountImages service,
            CancellationToken cancellationToken) =>
            {
                var error = await service.RemoveAsync(id, principal.FindFirstValue(ClaimTypes.NameIdentifier)!, cancellationToken);

                return error is null ? TypedResults.NoContent() : Error(error);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("RemoveAccountImage")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);
    }

    private static IResult Error(string code) => TypedResults.Json(new { code }, statusCode: code switch
    {
        "not_found" => StatusCodes.Status404NotFound,

        "image_too_large" => StatusCodes.Status413PayloadTooLarge,

        "image_unavailable" => StatusCodes.Status503ServiceUnavailable,

        "account_retired" => StatusCodes.Status409Conflict,

        _ => StatusCodes.Status400BadRequest
    });
}