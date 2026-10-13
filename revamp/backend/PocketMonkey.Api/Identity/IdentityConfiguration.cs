using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Identity;

public static class IdentityConfiguration
{
    public static IServiceCollection AddLocalIdentity(this IServiceCollection services, bool development)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = false;
                options.Password.RequiredLength = 12;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddEntityFrameworkStores<PocketMonkeyDbContext>()
            .AddDefaultTokenProviders();

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = development ? "monkey-session" : "__Host-monkey-session";
            options.Cookie.HttpOnly = true;
            options.Cookie.Path = "/";
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = development ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;

            options.ExpireTimeSpan = TimeSpan.FromHours(8);
            options.SlidingExpiration = false;

            options.Events.OnRedirectToLogin = context => RejectAsync(context, StatusCodes.Status401Unauthorized);
            options.Events.OnRedirectToAccessDenied = context => RejectAsync(context, StatusCodes.Status403Forbidden);
            options.Events.OnValidatePrincipal = async context =>
            {
                var manager = context.HttpContext.RequestServices.GetRequiredService<SignInManager<ApplicationUser>>();
                var user = await manager.ValidateSecurityStampAsync(context.Principal);

                if (user is null || !user.IsActive)
                {
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
                }
            };
        });

        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-Monkey-CSRF";

            options.Cookie.Name = development ? "monkey-csrf" : "__Host-monkey-csrf";
            options.Cookie.Path = "/";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = development ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("ReadyUser", policy => policy
                .RequireAuthenticatedUser()
                .RequireClaim("password_ready", "true"));

            options.AddPolicy(UserRole.Manager.ToIdentityName(), policy => policy
                .RequireRole(UserRole.Manager.ToIdentityName())
                .RequireClaim("password_ready", "true"));
        });

        services.AddScoped<IUserClaimsPrincipalFactory<ApplicationUser>, UserClaimsFactory>();
        services.AddScoped<UserAdministration>();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddFixedWindowLimiter("login", limiter =>
            {
                limiter.PermitLimit = 20;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.QueueLimit = 0;
            });
        });

        return services;
    }

    private static Task RejectAsync(
        Microsoft.AspNetCore.Authentication.RedirectContext<CookieAuthenticationOptions> context,
        int status)
    {
        context.Response.StatusCode = status;

        return Task.CompletedTask;
    }
}