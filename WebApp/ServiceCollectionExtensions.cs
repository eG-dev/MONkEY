using MONkEY.WebApp.Utils;

namespace MONkEY.WebApp
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddBrowserTimeProvider(this IServiceCollection services)
        {
            return services.AddTransient<TimeProvider, BrowserTimeProvider>();
        }
    }
}