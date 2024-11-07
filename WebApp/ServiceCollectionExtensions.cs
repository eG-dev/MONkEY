using Azure.Data.Tables;
using Azure.Storage.Blobs;

using MONkEY.BusinessLogic.Services;
using MONkEY.Data.Services;
using MONkEY.Identity.Services;
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

            return services;
        }

        public static IServiceCollection AddCustomServices(this IServiceCollection services)
        {
            services.AddScoped<IAccountOwnerService, AccountOwnerService>();
            services.AddScoped<IUserService, UserService>();

            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IReportService, ReportService>();

            services.AddScoped<IImageService, ImageService>();

            services.AddScoped<IAccountManagementService, AccountManagementService>();
            services.AddScoped<ITenantManagementService, TenantManagementService>();
            services.AddScoped<IUsageTermsService, UsageTermsService>();

            return services;
        }
    }
}
