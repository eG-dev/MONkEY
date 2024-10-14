using Azure.Data.Tables;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SendGrid;

using MONkEY.Data.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        var tableStorageConnectionString = Environment.GetEnvironmentVariable("TABLE_STORAGE_CONNECTION_STRING");
        if (!string.IsNullOrEmpty(tableStorageConnectionString))
        {
            TableServiceClient tableServiceClient = new(tableStorageConnectionString);

            services.AddSingleton(sp => tableServiceClient);

            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IReportService, ReportService>();
        }

        var sendGridApiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
        if (!string.IsNullOrEmpty(sendGridApiKey))
        {
            var emailClient = new SendGridClient(sendGridApiKey);

            services.AddScoped(sp => emailClient);
        }
    })
    .Build();

host.Run();
