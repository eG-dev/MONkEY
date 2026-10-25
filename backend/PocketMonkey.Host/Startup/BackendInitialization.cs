using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Storage;
using PocketMonkey.Host.Identity;

namespace PocketMonkey.Host.Startup;

public static class BackendInitialization
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(services);

        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<PocketMonkeyDbContext>();

        await database.Database.MigrateAsync(cancellationToken);

        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in Enum.GetValues<UserRole>())
        {
            var roleName = role.ToIdentityName();

            if (!await roles.RoleExistsAsync(roleName) && !(await roles.CreateAsync(new IdentityRole(roleName))).Succeeded)
            {
                throw new InvalidOperationException("Identity role initialization failed.");
            }
        }

        scope.ServiceProvider
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("foundation-key-check")
            .Protect("foundation");
    }
}