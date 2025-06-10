namespace MONkEY.Support
{
    public static class AmountUtils
    {
        public static string FormatValue(double value)
        {
            if (value == 0)
            {
                return "0";
            }

            return value % 1 == 0
                ? value.ToString("+0;-0")
                : value.ToString("+0.00;-0.00");
        }
    }
}
