using Microsoft.AspNetCore.Identity;
using PocketMonkey.Api.Contracts.Users;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;

namespace PocketMonkey.Api.Operations;

public static class OperatorCommands
{
    public static async Task<int> RunAsync(
        IServiceProvider services,
        string command,
        CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var administration = scope.ServiceProvider.GetRequiredService<UserAdministration>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        Console.Write("Username: ");
        var username = Console.ReadLine() ?? string.Empty;

        Console.Write("Password: ");
        var password = ReadPassword();

        UserAdministrationError? error;

        if (command == "bootstrap-manager")
        {
            error = await administration.CreateAsync(
                new CreateUserRequest
                {
                    Username = username,
                    DisplayName = username,
                    Password = password,
                    Role = "Manager"
                },
                "host-operator",
                true,
                cancellationToken);
        }
        else
        {
            var user = await users.FindByNameAsync(username);

            error = user is null
                ? UserAdministrationError.NotFound
                : await administration.ResetAsync(user.Id, password, "host-operator", true, cancellationToken);
        }

        Console.WriteLine(error?.ToCode() ?? "operator_success");

        return error is null ? 0 : 1;
    }

    private static string ReadPassword()
    {
        if (Console.IsInputRedirected)
        {
            return Console.ReadLine() ?? string.Empty;
        }

        var password = new System.Text.StringBuilder();

        while (true)
        {
            var key = Console.ReadKey(true);

            if (key.Key == ConsoleKey.Enter)
            {
                Console.WriteLine();

                return password.ToString();
            }

            if (key.Key == ConsoleKey.Backspace && password.Length > 0)
            {
                password.Length--;
            }
            else if (!char.IsControl(key.KeyChar) && password.Length < 256)
            {
                password.Append(key.KeyChar);
            }
        }
    }
}