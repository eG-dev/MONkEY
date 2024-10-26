namespace MONkEY.Data.Services
{
    public interface IReportService
    {
        Task InitAsync();

        Task AddAsync(Report model);

        Task<Report?> GetForPeriodAsync(string tenantKey, string accountKey, DateTimeOffset reportedPeriod);
    }
}