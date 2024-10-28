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

        var storageConnectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");
        if (!string.IsNullOrEmpty(storageConnectionString))
        {
            TableServiceClient tableServiceClient = new(storageConnectionString);

            services.AddSingleton(sp => tableServiceClient);

            services.AddScoped<IAccountOwnerService, AccountOwnerService>();

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
