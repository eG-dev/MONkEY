using System.Security.Cryptography;

namespace PocketMonkey.Api.Services;

public static class TemporaryPassword
{
    // Unambiguous characters only, because the password is read and typed by people.
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    public static string Generate()
    {
        while (true)
        {
            var groups = Enumerable.Range(0, 4)
                .Select(_ => new string(Enumerable.Range(0, 4)
                    .Select(_ => Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)])
                    .ToArray()));
            var password = string.Join('-', groups);

            // Identity requires each character class; rejection sampling keeps the distribution uniform.
            if (password.Any(char.IsUpper) && password.Any(char.IsLower) && password.Any(char.IsDigit))
            {
                return password;
            }
        }
    }
}
