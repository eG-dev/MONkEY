using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Globalization;

using MONkEY.Notifications.Email;
using MONkEY.Functions;

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

        services.AddCustomAzureStorage();
        services.AddCustomServices();
    })
    .Build();

var culture = CultureInfo.CreateSpecificCulture("de-DE");
CultureInfo.CurrentCulture = culture;
CultureInfo.CurrentUICulture = culture;

host.Run();
