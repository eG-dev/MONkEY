using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PocketMonkey.Api.Configuration;

namespace PocketMonkey.Api.Storage;

public sealed class StorageReadinessCheck : IHealthCheck
{
    private readonly IServiceScopeFactory scopeFactory;

    public StorageReadinessCheck(IServiceScopeFactory scopeFactory)
    {
        this.scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<PocketMonkeyDbContext>();
            var settings = scope.ServiceProvider.GetRequiredService<InstanceSettings>();
            _ = await database.Accounts
                .AsNoTracking()
                .AnyAsync(cancellationToken);
            _ = await database.Users
                .AsNoTracking()
                .AnyAsync(cancellationToken);
            settings.PrepareStorage();
            return HealthCheckResult.Healthy();
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("Persistent storage is unavailable.", exception);
        }
    }
}