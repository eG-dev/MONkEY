using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;

namespace PocketMonkey.Api.Storage;

public static class FoundationStorage
{
    public static async Task InitializeAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(services);

        using var scope = services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<FoundationDbContext>();
        var settings = scope.ServiceProvider.GetRequiredService<InstanceSettings>();

        await database.Database.MigrateAsync(cancellationToken);

        if (!await database.FoundationStates.AnyAsync(cancellationToken))
        {
            database.FoundationStates.Add(new FoundationState
            {
                Id = 1,
                SampleId = Guid.NewGuid().ToString(),
                InitializedAtUtc = DateTimeOffset.UtcNow
            });
            await database.SaveChangesAsync(cancellationToken);
        }

        if (!File.Exists(settings.SampleFilePath))
        {
            await File.WriteAllTextAsync(settings.SampleFilePath, "POCKET MONkEY foundation file\n", cancellationToken);
        }

        scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("foundation-key-check")
            .Protect("foundation");
    }
}