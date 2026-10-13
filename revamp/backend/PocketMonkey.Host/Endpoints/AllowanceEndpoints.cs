using System.Security.Claims;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Identity;
using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.Endpoints;

public static class AllowanceEndpoints
{
    public static void MapAllowances(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app.MapGet("/api/accounts/{id}/allowance", async Task<IResult> (
            string id, ClaimsPrincipal principal, AllowanceAdministration administration, CancellationToken cancellationToken) =>
            {
                var response = await administration.FindAsync(id, cancellationToken,
                    principal.IsInRole(UserRole.Manager.ToIdentityName()));
                return response is null ? TypedResults.NotFound(new { code = "not_found" }) : TypedResults.Ok(response);
            })
            .RequireAuthorization("ReadyUser")
            .WithTags("Accounts")
            .WithName("GetAllowance")
            .Produces<AllowanceResponse>();

        app.MapPut("/api/accounts/{id}/allowance", async Task<IResult> (
            string id, AllowanceRequest request, ClaimsPrincipal principal,
            AllowanceAdministration administration, CancellationToken cancellationToken) =>
            {
                var result = await administration.SaveAsync(id, request,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!, cancellationToken);

                return result.Error is null ? TypedResults.Ok(result.Configuration) : TypedResults.Json(new { code = result.Error },
                    statusCode: result.Error == "not_found" ? 404 : result.Error is "allowance_conflict" or "not_initialized" ? 409 : 400);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithTags("Accounts")
            .WithName("ConfigureAllowance")
            .Produces<AllowanceResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict);
    }
}