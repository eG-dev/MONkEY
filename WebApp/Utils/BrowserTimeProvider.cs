namespace MONkEY.WebApp.Utils
{
    public sealed class BrowserTimeProvider
    {
        private TimeZoneInfo? _browserLocalTimeZone;

        // Notify when the local time zone changes
        public event EventHandler? LocalTimeZoneChanged;

        public TimeZoneInfo LocalTimeZone => _browserLocalTimeZone ?? TimeZoneInfo.Local;

        internal bool IsLocalTimeZoneSet => _browserLocalTimeZone != null;

        // Set the local time zone
        public void SetBrowserTimeZone(string timeZone)
        {
            if (!TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out var timeZoneInfo))
            {
                timeZoneInfo = null;
            }

            if (timeZoneInfo != LocalTimeZone)
            {
                _browserLocalTimeZone = timeZoneInfo;
                LocalTimeZoneChanged?.Invoke(this, EventArgs.Empty);
            }
        }
    }
}
