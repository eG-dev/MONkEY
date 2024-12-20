using Azure.Data.Tables;
using Azure.Storage.Queues;
using Microsoft.Extensions.DependencyInjection;

using MONkEY.Data.Services;
using MONkEY.Notifications.Email.Handler;
using MONkEY.Notifications.Email.Services;
using MONkEY.Notifications.Email.Triggers;

namespace MONkEY.Functions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddCustomAzureStorage(this IServiceCollection services)
        {
            var storageConnectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");

            TableServiceClient tableServiceClient = new(storageConnectionString);
            services.AddSingleton(sp => tableServiceClient);

            QueueServiceClient queueServiceClient = new(storageConnectionString);
            services.AddSingleton(sp => queueServiceClient);

            return services;
        }

        public static IServiceCollection AddCustomServices(this IServiceCollection services)
        {
            services.AddScoped<IAccountOwnerService, AccountOwnerService>();

            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IReportService, ReportService>();

            services.AddScoped<IEmailTriggerService, EmailTriggerService>();
            services.AddScoped<IEmailSenderService, EmailSenderService>();

            services.AddScoped<IEmailTriggerHandler<ReportEmailTrigger>, ReportEmailTriggerHandler>();

            return services;
        }
    }
}
