using System.Security.Claims;
using PocketMonkey.Api.Contracts.Accounts;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Identity;
using PocketMonkey.Api.Services;

namespace PocketMonkey.Api.Endpoints;

public static class OpeningBalanceEndpoints
{
    public static void MapOpeningBalances(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app.MapPost("/api/accounts/{id}/opening", async Task<IResult> (
            string id,
            OpeningBalanceRequest request,
            ClaimsPrincipal principal,
            LedgerAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var result = await administration.PostOpeningAsync(
                    id, request, principal.FindFirstValue(ClaimTypes.NameIdentifier)!, cancellationToken);

                return result.Error is { } error ? ToResult(error) : TypedResults.Ok(result.Entry);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithTags("Accounts")
            .WithName("PostOpeningBalance")
            .Produces<LedgerEntryResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);
    }

    private static IResult ToResult(LedgerError error) => error switch
    {
        LedgerError.InvalidAmount => Failure("invalid_opening_amount", StatusCodes.Status400BadRequest),

        LedgerError.InvalidComment => Failure("invalid_comment", StatusCodes.Status400BadRequest),

        LedgerError.InvalidIdempotencyKey => Failure("invalid_idempotency_key", StatusCodes.Status400BadRequest),

        LedgerError.NotFound => Failure("not_found", StatusCodes.Status404NotFound),

        LedgerError.AlreadyInitialized => Failure("already_initialized", StatusCodes.Status409Conflict),

        LedgerError.IdempotencyConflict => Failure("idempotency_conflict", StatusCodes.Status409Conflict),

        _ => throw new ArgumentOutOfRangeException(nameof(error), error, "Unsupported opening error.")
    };

    private static IResult Failure(string code, int status) => TypedResults.Json(new { code }, statusCode: status);
}