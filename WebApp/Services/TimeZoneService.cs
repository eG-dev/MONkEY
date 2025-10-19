using Microsoft.JSInterop;
using MONkEY.WebApp.Utils;

namespace MONkEY.WebApp.Services
{
    public class TimeZoneService : ITimeZoneService
    {
        private readonly IJSRuntime _jsRuntime;
        private readonly BrowserTimeProvider _timeProvider;

        public TimeZoneService(IJSRuntime jsRuntime, BrowserTimeProvider timeProvider)
        {
            _jsRuntime = jsRuntime;
            _timeProvider = timeProvider;
        }

        public bool IsInitialized => _timeProvider.IsLocalTimeZoneSet;

        public async Task InitializeAsync()
        {
            if (!_timeProvider.IsLocalTimeZoneSet)
            {
                try
                {
                    await using var module = await _jsRuntime.InvokeAsync<IJSObjectReference>("import", "./js/timezone.js");
                    var timeZone = await module.InvokeAsync<string>("getBrowserTimeZone");

                    _timeProvider.SetBrowserTimeZone(timeZone);
                }
                catch (JSDisconnectedException)
                {
                    // Handle disconnection gracefully
                }
            }
        }

        public string Format(DateTime dateTime, string format)
        {
            DateTime value = dateTime.Kind switch
            {
                DateTimeKind.Unspecified => throw new InvalidOperationException("Unable to convert unspecified DateTime to local time"),
                DateTimeKind.Local => dateTime,
                _ => DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(dateTime, _timeProvider.LocalTimeZone), DateTimeKind.Local),
            };

            return value.ToString(format);
        }

        public string Format(DateTimeOffset dateTime, string format)
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(dateTime.UtcDateTime, _timeProvider.LocalTimeZone);
            local = DateTime.SpecifyKind(local, DateTimeKind.Local);
            
            return local.ToString(format);
        }
    }
}