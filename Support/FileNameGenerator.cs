using System.Security.Cryptography;

namespace MONkEY.Support
{
    public static class FileNameGenerator
    {
        private const string CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        public static string GetRandom(int length = 24)
        {
            return RandomNumberGenerator.GetString(CHARS, length);
        }
    }
}
