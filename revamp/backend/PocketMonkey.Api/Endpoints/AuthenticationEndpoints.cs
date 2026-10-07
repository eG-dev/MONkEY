using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Contracts.Authentication;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Endpoints;

public static class AuthenticationEndpoints
{
    public static void MapAuthentication(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth")
            .WithTags("Authentication");

        auth.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) =>
            TypedResults.Ok(new { token = antiforgery.GetAndStoreTokens(context).RequestToken }))
            .AllowAnonymous();

        auth.MapPost("/login", LoginAsync)
            .AllowAnonymous()
            .RequireRateLimiting("login");

        auth.MapPost("/logout", async (SignInManager<ApplicationUser> signin) =>
            {
                await signin.SignOutAsync();

                return TypedResults.NoContent();
            })
            .RequireAuthorization();

        auth.MapGet("/me", async Task<IResult> (
            ClaimsPrincipal principal,
            UserManager<ApplicationUser> users,
            UserAdministration administration) =>
            {
                var user = await users.GetUserAsync(principal);

                return user is null
                    ? TypedResults.Unauthorized()
                    : TypedResults.Ok(await administration.DescribeAsync(user));
            })
            .RequireAuthorization()
            .Produces<SessionResponse>();

        auth.MapPost("/password", ChangePasswordAsync)
            .RequireAuthorization();

        auth.MapPut("/language", async Task<IResult> (
            LanguageRequest request,
            ClaimsPrincipal principal,
            UserManager<ApplicationUser> users,
            CancellationToken cancellationToken) =>
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (request.Language is not ("de" or "en"))
                {
                    return EndpointErrors.ToResult(UserAdministrationError.InvalidLanguage);
                }

                var user = (await users.GetUserAsync(principal))!;
                user.Language = request.Language;

                return (await users.UpdateAsync(user)).Succeeded
                    ? TypedResults.NoContent()
                    : EndpointErrors.ToResult(UserAdministrationError.InvalidUser);
            })
            .RequireAuthorization("ReadyUser");
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        UserManager<ApplicationUser> users,
        SignInManager<ApplicationUser> signin,
        UserAdministration administration,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 100 ||
            request.Password is not { Length: > 0 and <= 256 })
        {
            return TypedResults.Unauthorized();
        }

        var user = await users.FindByNameAsync(request.Username.Trim());

        if (user is null)
        {
            new PasswordHasher<ApplicationUser>()
                .VerifyHashedPassword(new ApplicationUser(), DummyPasswordHash, request.Password);

            return TypedResults.Unauthorized();
        }

        var result = await signin.CheckPasswordSignInAsync(user, request.Password, true);

        if (!result.Succeeded || !user.IsActive)
        {
            return TypedResults.Unauthorized();
        }

        await signin.SignInAsync(user, false);

        return TypedResults.Ok(await administration.DescribeAsync(user));
    }

    private static readonly string DummyPasswordHash = new PasswordHasher<ApplicationUser>()
        .HashPassword(new ApplicationUser(), Guid.NewGuid().ToString());

    private static async Task<IResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        ClaimsPrincipal principal,
        UserManager<ApplicationUser> users,
        SignInManager<ApplicationUser> signin,
        UserAdministration administration,
        FoundationDbContext database,
        CancellationToken cancellationToken)
    {
        if (!UserAdministration.ValidPassword(request.NewPassword) ||
            request.CurrentPassword is not { Length: > 0 and <= 256 })
        {
            return EndpointErrors.ToResult(UserAdministrationError.InvalidPassword);
        }

        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var user = (await users.GetUserAsync(principal))!;

        if (!(await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword)).Succeeded)
        {
            return EndpointErrors.ToResult(UserAdministrationError.InvalidPassword);
        }

        user.MustChangePassword = false;

        if (!(await users.UpdateAsync(user)).Succeeded)
        {
            return EndpointErrors.ToResult(UserAdministrationError.InvalidUser);
        }

        administration.AddAudit(user.Id, user.Id, "password_changed");
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await signin.SignOutAsync();

        return TypedResults.NoContent();
    }
}