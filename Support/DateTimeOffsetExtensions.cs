namespace MONkEY.Support
{
    public static class DateTimeOffsetExtensions
    {
        public static DateTimeOffset ToNextMonth(this DateTimeOffset value)
        {
            var year = value.Month == 12 ? value.Year + 1 : value.Year;
            var month = value.Month == 12 ? 1 : value.Month + 1;

            return new DateTimeOffset(year, month, 1, value.Hour, value.Minute, value.Second, value.Millisecond, value.Microsecond, value.Offset);
        }

        public static DateTimeOffset ToPreviousMonth(this DateTimeOffset value)
        {
            var year = value.Month == 1 ? value.Year - 1 : value.Year;
            var month = value.Month == 1 ? 12 : value.Month - 1;

            return new DateTimeOffset(year, month, 1, value.Minute, value.Second, value.Millisecond, value.Microsecond, value.Offset);
        }

        public static DateTimeOffset StartOfMonth(this DateTimeOffset value)
        {
            return new DateTimeOffset(value.Year, value.Month, 1, 0, 0, 0, value.Offset);
        }

        public static DateTimeOffset EndOfMonth(this DateTimeOffset value)
        {
            return value.ToNextMonth().Subtract(TimeSpan.FromMicroseconds(1));
        }
    }
}
