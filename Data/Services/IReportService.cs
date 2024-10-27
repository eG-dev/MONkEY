namespace MONkEY.Data.Services
{
    public interface IReportService
    {
        Task InitAsync();

        Task AddAsync(Report model);

        Task DeleteAll(string tenantKey, string accountKey);

        Task<Report?> GetForPeriodAsync(string tenantKey, string accountKey, DateTimeOffset reportedPeriod);
    }
}