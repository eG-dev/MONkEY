namespace MONkEY.Data.Services
{
    public interface IReportService
    {
        Task InitAsync();

        Task AddAsync(Report model);

        Task UpdateAsync(Report model);

        Task<Report?> GetForPeriodAsync(string tenant, string accountKey, DateTimeOffset reportedPeriod);
    }
}