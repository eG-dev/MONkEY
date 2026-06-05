using Azure.Monitor.OpenTelemetry.Exporter;
using Microsoft.Azure.Functions.Worker.OpenTelemetry;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Globalization;

using MONkEY.Functions;
using MONkEY.Notifications.Email.Configuration;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        services.AddOpenTelemetry()
            .UseFunctionsWorkerDefaults()
            .UseAzureMonitorExporter();

        services.AddOptions<SmtpSettings>()
            .Configure<IConfiguration>((settings, configuration) =>
            {
                configuration.GetSection(nameof(SmtpSettings)).Bind(settings);
            });

        services.AddCustomAzureStorage();
        services.AddCustomServices();
    })
    .Build();

var culture = CultureInfo.CreateSpecificCulture("de-DE");
CultureInfo.CurrentCulture = culture;
CultureInfo.CurrentUICulture = culture;

host.Run();
