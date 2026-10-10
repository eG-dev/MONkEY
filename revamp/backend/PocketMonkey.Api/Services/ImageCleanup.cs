namespace PocketMonkey.Api.Services;

public sealed class ImageCleanup : BackgroundService
{
    private readonly IServiceScopeFactory scopes;
    private readonly ILogger<ImageCleanup> logger;

    public ImageCleanup(IServiceScopeFactory scopes, ILogger<ImageCleanup> logger)
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
                await scope.ServiceProvider.GetRequiredService<AccountImages>().CollectAsync(stoppingToken);
            }
            catch (Exception failure) when (failure is not OperationCanceledException)
            {
                logger.LogError(failure, "Image orphan cleanup failed; it will be retried");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}