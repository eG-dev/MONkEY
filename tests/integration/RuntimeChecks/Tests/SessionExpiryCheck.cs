using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;

namespace RuntimeChecks.Tests;

internal static class SessionExpiryCheck
{
    public static void Run()
    {
        var provider = DataProtectionProvider.Create(
            new DirectoryInfo("/data/keys"),
            options => options.SetApplicationName("POCKET MONkEY"));
        var protector = provider.CreateProtector(
            "Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationMiddleware",
            "Identity.Application",
            "v2");
        var format = new TicketDataFormat(protector);
        var ticket = format.Unprotect(Console.ReadLine() ?? string.Empty)
            ?? throw new InvalidOperationException("Session ticket could not be read.");

        if (ticket.Properties.ExpiresUtc - ticket.Properties.IssuedUtc != TimeSpan.FromHours(8) || ticket.Properties.IsPersistent)
        {
            throw new InvalidOperationException("Session lifetime or persistence differs from the agreed policy.");
        }

        ticket.Properties.ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(-1);
        ticket.Properties.IssuedUtc = ticket.Properties.ExpiresUtc.Value.AddHours(-8);

        Console.WriteLine(format.Protect(ticket));
    }
}