using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Contracts.Users;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Endpoints;

public static class UserEndpoints
{
    public static void MapUsers(this WebApplication app)
    {
        var management = app.MapGroup("/api/users")
            .RequireAuthorization("Manager")
            .WithTags("Users");

        management.MapGet("", async (
            FoundationDbContext database,
            UserAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var accounts = await database.Users
                    .OrderBy(x => x.UserName)
                    .ToListAsync(cancellationToken);
                var responses = new List<UserResponse>();

                foreach (var account in accounts)
                {
                    responses.Add(new UserResponse
                    {
                        User = await administration.DescribeAsync(account),
                        IsActive = account.IsActive
                    });
                }

                return TypedResults.Ok(responses);
            });

        management.MapPost("", async Task<IResult> (
            CreateUserRequest request,
            ClaimsPrincipal principal,
            UserAdministration administration,
            UserManager<ApplicationUser> users,
            CancellationToken cancellationToken) =>
            {
                var error = await administration.CreateAsync(
                    request,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    false,
                    cancellationToken);

                if (error is not null)
                {
                    return EndpointErrors.ToResult(error.Value);
                }

                var user = (await users.FindByNameAsync(request.Username.Trim()))!;

                return TypedResults.Created($"/api/users/{user.Id}", await administration.DescribeAsync(user));
            });

        management.MapPut("/{id}", async Task<IResult> (
            string id,
            UpdateUserRequest request,
            ClaimsPrincipal principal,
            UserAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var error = await administration.UpdateAsync(
                    id,
                    request,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    cancellationToken);

                return error is null
                    ? TypedResults.NoContent()
                    : EndpointErrors.ToResult(error.Value);
            });

        management.MapPost("/{id}/password", async Task<IResult> (
            string id,
            ResetPasswordRequest request,
            ClaimsPrincipal principal,
            UserAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var error = await administration.ResetAsync(
                    id,
                    request.Password,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    false,
                    cancellationToken);

                return error is null
                    ? TypedResults.NoContent()
                    : EndpointErrors.ToResult(error.Value);
            });
    }
}