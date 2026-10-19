using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.HostedServices;

public sealed class TransactionRetentionWorker : BackgroundService
{
    private readonly IServiceScopeFactory scopes;
    private readonly TimeProvider time;
    private readonly ILogger<TransactionRetentionWorker> logger;

    public TransactionRetentionWorker(IServiceScopeFactory scopes, TimeProvider time,
        ILogger<TransactionRetentionWorker> logger)
    {
        this.scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        this.time = time ?? throw new ArgumentNullException(nameof(time));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromDays(1), time);

        do
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<TransactionRetention>().RunAsync(stoppingToken);
            }
            catch (Exception failure) when (failure is not OperationCanceledException)
            {
                logger.LogError("Retention failed with {FailureType}; retrying at the next scan", failure.GetType().Name);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}