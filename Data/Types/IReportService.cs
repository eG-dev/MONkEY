using MONkEY.Data.Entities;
using MONkEY.Data.Types.Reporting;

namespace MONkEY.Data.Types
{
    public interface IReportService
    {
        Task InitAsync();

        Task AddAsync(Report model);

        Task DeleteForAccountAsync(string tenantKey, string accountKey);

        Task DeleteOlderThanAsync(string tenantKey, DateTimeOffset olderThan);

        Task<List<Report>> GetAsync(string tenantKey, ReportType type, int? pageSize = null, DateTimeOffset? olderThan = null);

        Task<List<Report>> GetForPeriodAsync(string tenantKey, DateTimeOffset reportedPeriod, ReportType type);

        Task<Report?> GetLatestAsync(string tenantKey, string accountKey, ReportType type);
    }
}