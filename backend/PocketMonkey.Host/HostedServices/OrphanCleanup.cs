using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.HostedServices;

public sealed class OrphanCleanup : BackgroundService
{
    private readonly IServiceScopeFactory scopes;
    private readonly ILogger<OrphanCleanup> logger;

    public OrphanCleanup(IServiceScopeFactory scopes, ILogger<OrphanCleanup> logger)
    {
        this.scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));

        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<AccountAdministration>().PurgeDueAsync(stoppingToken);
                
                var images = scope.ServiceProvider.GetRequiredService<AccountImages>();
                await images.CollectPendingAsync(stoppingToken);
                await images.CollectAsync(stoppingToken);
            }
            catch (Exception failure) when (failure is not OperationCanceledException)
            {
                logger.LogError(failure, "Orphan cleanup failed; it will be retried");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}