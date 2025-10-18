using System;

namespace MONkEY.WebApp.Services
{
    public interface ITimeZoneService
    {
        Task InitializeAsync();

        string Format(DateTime dateTime, string format);

        string Format(DateTimeOffset dateTime, string format);

        bool IsInitialized { get; }
    }
}