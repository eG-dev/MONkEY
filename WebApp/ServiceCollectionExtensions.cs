using Azure.Data.Tables;
using Azure.Storage.Blobs;

using MONkEY.Data.Services;
using MONkEY.WebApp.Services;
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
            BlobContainerClient blobContainerClient = new(storageConnectionString, "images");

            services.AddSingleton(sp => tableServiceClient);
            services.AddSingleton(sp => blobContainerClient);

            return services;
        }

        public static IServiceCollection AddCustomServices(this IServiceCollection services)
        {
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IReportService, ReportService>();
            services.AddScoped<IBlobService, BlobService>();

            services.AddScoped<AccountManagementService>();

            return services;
        }
    }
}
