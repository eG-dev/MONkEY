using Azure.Data.Tables;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MONkEY.Data.Services;
using SendGrid;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        var tableStorageConnectionString = Environment.GetEnvironmentVariable("TABLE_STORAGE_CONNECTION_STRING");
        TableServiceClient tableServiceClient = new(tableStorageConnectionString);

        services.AddScoped(sp => tableServiceClient);
        services.AddScoped<AccountService>();
        services.AddScoped<TransactionService>();

        var sendGridApiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        var emailClient = new SendGridClient(sendGridApiKey);

        services.AddScoped(sp => emailClient);
    })
    .Build();

host.Run();
