namespace MONkEY.Data.Services
{
    public static class AccountOwnerRole
    {
        public static string User { get; } = default!;

        public static string Manager { get; } = "Manager";

        public static string GlobalAdmin { get; } = "GlobalAdmin";
    }
}
