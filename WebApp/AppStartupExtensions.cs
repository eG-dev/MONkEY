using MONkEY.Data.Services;

namespace MONkEY.WebApp
{
    public static class AppStartupExtensions
    {
        public static async Task<WebApplication> InitStorage(this WebApplication app)
        {
            var scope = app.Services.CreateScope();

            var tenantMemberService = scope.ServiceProvider.GetService<ITenantMemberService>()!;
            await tenantMemberService.InitAsync();

            var accountService = scope.ServiceProvider.GetService<IAccountService>()!;
            await accountService.InitAsync();

            var transactionService = scope.ServiceProvider.GetService<ITransactionService>()!;
            await transactionService.InitAsync();

            var reportService = scope.ServiceProvider.GetService<IReportService>()!;
            await reportService.InitAsync();

            return app;
        }
    }
}
