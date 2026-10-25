using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.HostedServices;

public sealed class FinancialExportWorker : BackgroundService
{
    private readonly IServiceScopeFactory scopes;
    private readonly FinancialExportStore store;
    private readonly InstanceSettings settings;
    private readonly TimeProvider clock;
    private readonly ILogger<FinancialExportWorker> logger;

    public FinancialExportWorker(IServiceScopeFactory scopes, FinancialExportStore store,
        InstanceSettings settings, TimeProvider clock, ILogger<FinancialExportWorker> logger)
    {
        this.scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        this.store = store ?? throw new ArgumentNullException(nameof(store));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.clock = clock ?? throw new ArgumentNullException(nameof(clock));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1), clock);

        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<FinancialSnapshotService>();

                if (await store.CheckAsync(service.CaptureAsync, clock.GetUtcNow(), settings.Timezone, stoppingToken))
                {
                    logger.LogInformation("Financial snapshot published");
                }
            }
            catch (Exception failure) when (failure is not OperationCanceledException)
            {
                logger.LogError("Financial export failed ({FailureType}); it will be retried", failure.GetType().Name);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}