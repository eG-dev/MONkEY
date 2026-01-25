using Azure.Data.Tables;
using Azure.Storage.Blobs;
using Azure.Storage.Queues;
using MONkEY.BusinessLogic.Services;
using MONkEY.Data.Services;
using MONkEY.Identity.Services;
using MONkEY.Notifications.Email.Services;
using MONkEY.WebApp.Utils;

namespace MONkEY.WebApp
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddBrowserTimeSupport(this IServiceCollection services)
        {
            return services.AddScoped<BrowserTimeProvider>();
        }

        public static IServiceCollection AddCustomAzureStorage(this IServiceCollection services, ConfigurationManager config)
        {
            var storageConnectionString = config.GetConnectionString("STORAGE_CONNECTION_STRING");

            TableServiceClient tableServiceClient = new(storageConnectionString);
            services.AddSingleton(sp => tableServiceClient);

            BlobServiceClient blobServiceClient = new(storageConnectionString);
            services.AddSingleton(sp => blobServiceClient);

            QueueServiceClient queueServiceClient = new(storageConnectionString);
            services.AddSingleton(sp => queueServiceClient);

            return services;
        }

        public static IServiceCollection AddCustomServices(this IServiceCollection services)
        {
            services.AddScoped<ITenantMemberService, TenantMemberService>();
            services.AddScoped<IUserService, UserService>();

            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IReportService, ReportService>();

            services.AddScoped<IImageService, ImageService>();

            services.AddScoped<IAccountManagementService, AccountManagementService>();
            services.AddScoped<ITenantManagementService, TenantManagementService>();
            services.AddScoped<IUsageTermsService, UsageTermsService>();

            services.AddScoped<IEmailTriggerService, EmailTriggerService>();

            return services;
        }
    }
}
