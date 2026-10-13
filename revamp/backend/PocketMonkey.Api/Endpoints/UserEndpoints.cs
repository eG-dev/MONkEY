using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Contracts.Users;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Identity;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Endpoints;

public static class UserEndpoints
{
    public static void MapUsers(this WebApplication app)
    {
        var management = app.MapGroup("/api/users")
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithTags("Users");

        management.MapGet("", async (
            PocketMonkeyDbContext database,
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
                var temporaryPassword = TemporaryPassword.Generate();
                var error = await administration.CreateAsync(
                    request with { Password = temporaryPassword },
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    false,
                    cancellationToken);

                if (error is not null)
                {
                    return EndpointErrors.ToResult(error.Value);
                }

                var user = (await users.FindByNameAsync(request.Username.Trim()))!;

                return TypedResults.Created($"/api/users/{user.Id}", new CreatedUserResponse
                {
                    User = await administration.DescribeAsync(user),
                    TemporaryPassword = temporaryPassword
                });
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
            ClaimsPrincipal principal,
            UserAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var temporaryPassword = TemporaryPassword.Generate();
                var error = await administration.ResetAsync(
                    id,
                    temporaryPassword,
                    principal.FindFirstValue(ClaimTypes.NameIdentifier)!,
                    false,
                    cancellationToken);

                return error is null
                    ? TypedResults.Ok(new TemporaryPasswordResponse { TemporaryPassword = temporaryPassword })
                    : EndpointErrors.ToResult(error.Value);
            });
    }
}