using System.Security.Claims;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Identity;
using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.Endpoints;

public static class AccountEndpoints
{
    public static void MapAccounts(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        var accounts = app.MapGroup("/api/accounts")
            .RequireAuthorization("ReadyUser")
            .WithTags("Accounts");

        accounts.MapGet("", async (
            ClaimsPrincipal principal,
            AccountAdministration administration,
            CancellationToken cancellationToken) =>
            TypedResults.Ok(await administration.ListAsync(cancellationToken, AccountReadAccess.MemberId(principal))))
            .WithName("ListAccounts");

        accounts.MapGet("/archived", async (
            AccountAdministration administration,
            CancellationToken cancellationToken) =>
            TypedResults.Ok(await administration.ListRetiredAsync(cancellationToken)))
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("ListRetiredAccounts")
            .Produces<List<AccountResponse>>();

        accounts.MapGet("/{id}", async Task<IResult> (
            string id,
            ClaimsPrincipal principal,
            AccountAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var account = await administration.FindAsync(id, cancellationToken, AccountReadAccess.MemberId(principal));

                return account is null
                    ? ToResult(AccountError.NotFound)
                    : TypedResults.Ok(account);
            })
            .WithName("GetAccount")
            .Produces<AccountResponse>()
            .Produces(StatusCodes.Status404NotFound);

        accounts.MapPost("", async Task<IResult> (
            CreateAccountRequest request,
            ClaimsPrincipal principal,
            AccountAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var result = await administration.CreateAsync(
                    request,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    cancellationToken);

                return result.Error is { } error
                    ? ToResult(error)
                    : TypedResults.Created($"/api/accounts/{result.Account!.Id}", result.Account);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("CreateAccount")
            .Produces<AccountResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict);

        accounts.MapPut("/{id}", async Task<IResult> (
            string id,
            UpdateAccountRequest request,
            ClaimsPrincipal principal,
            AccountAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var result = await administration.UpdateAsync(
                    id,
                    request,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    cancellationToken);

                return result.Error is { } error
                    ? ToResult(error)
                    : TypedResults.Ok(result.Account);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("UpdateAccount")
            .Produces<AccountResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        accounts.MapDelete("/{id}", async Task<IResult> (
            string id, ClaimsPrincipal principal, AccountAdministration administration, CancellationToken cancellationToken) =>
            {
                var result = await administration.DeleteAsync(id,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!, cancellationToken);

                return result.Error is not null
                    ? LifecycleError(result.Error)
                    : result.PurgeAtUtc is { } purgeAtUtc
                        ? TypedResults.Accepted(uri: (string?)null, value: new { purgeAtUtc })
                        : TypedResults.NoContent();
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("DeleteAccount")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status202Accepted)
            .Produces(StatusCodes.Status404NotFound);

        accounts.MapPost("/{id}/reactivate", async Task<IResult> (
            string id, ReactivateAccountRequest? request, ClaimsPrincipal principal,
            AccountAdministration administration, CancellationToken cancellationToken) =>
            {
                var error = await administration.ReactivateAsync(id, request?.MissedAllowancePolicy,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!, cancellationToken);

                return error is null ? TypedResults.NoContent() : LifecycleError(error);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("ReactivateAccount")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);
    }

    private static IResult LifecycleError(string code) => TypedResults.Json(new { code }, statusCode: code switch
    {
        "not_found" => StatusCodes.Status404NotFound,

        "account_deletion_expired" => StatusCodes.Status409Conflict,

        _ => StatusCodes.Status400BadRequest
    });

    private static IResult ToResult(AccountError error) => error switch
    {
        AccountError.InvalidName => TypedResults.Json(
            new { code = "invalid_account_name" }, statusCode: StatusCodes.Status400BadRequest),

        AccountError.DuplicateName => TypedResults.Json(
            new { code = "account_name_taken" }, statusCode: StatusCodes.Status409Conflict),

        AccountError.NotFound => TypedResults.Json(
            new { code = "not_found" }, statusCode: StatusCodes.Status404NotFound),

        AccountError.Retired => TypedResults.Json(
            new { code = "account_retired" }, statusCode: StatusCodes.Status409Conflict),

        _ => throw new ArgumentOutOfRangeException(nameof(error), error, "Unsupported account error.")
    };
}