using Azure.Data.Tables;
using Azure.Storage.Queues;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Globalization;

using MONkEY.Data.Services;
using MONkEY.Functions.DTO;
using MONkEY.Functions.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();

        services.AddOptions<SmtpSettings>()
            .Configure<IConfiguration>((settings, configuration) =>
            {
                configuration.GetSection(nameof(SmtpSettings)).Bind(settings);
            });

        services.AddScoped<IEmailService, EmailService>();

        var storageConnectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");
        if (!string.IsNullOrEmpty(storageConnectionString))
        {
            TableServiceClient tableServiceClient = new(storageConnectionString);
            services.AddSingleton(sp => tableServiceClient);

            QueueServiceClient queueServiceClient = new QueueServiceClient(storageConnectionString);
            services.AddSingleton(sp => queueServiceClient);

            services.AddScoped<IAccountOwnerService, AccountOwnerService>();

            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IReportService, ReportService>();
        }
    })
    .Build();

var culture = CultureInfo.CreateSpecificCulture("de-DE");
CultureInfo.CurrentCulture = culture;
CultureInfo.CurrentUICulture = culture;

host.Run();
