using PocketMonkey.Api.Services;

namespace PocketMonkey.Api.HostedServices;

public sealed class AllowanceWorker : BackgroundService
{
    private readonly IServiceScopeFactory scopes;
    private readonly ILogger<AllowanceWorker> logger;

    public AllowanceWorker(IServiceScopeFactory scopes, ILogger<AllowanceWorker> logger)
    {
        this.scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<AllowanceExecutor>().RunAsync(stoppingToken);
            }
            catch (Exception failure) when (failure is not OperationCanceledException)
            {
                logger.LogError(failure, "Allowance scan failed; it will be retried");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}