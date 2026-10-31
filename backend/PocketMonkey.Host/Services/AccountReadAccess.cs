using System.Security.Claims;
using PocketMonkey.Host.Identity;
using PocketMonkey.Storage;
using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Services;

public static class AccountReadAccess
{
    public static string? MemberId(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);

        return principal.IsInRole(UserRole.Manager.ToIdentityName())
            ? null
            : principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }

    public static IQueryable<Account> Accounts(PocketMonkeyDbContext database, string? memberId)
    {
        ArgumentNullException.ThrowIfNull(database);

        return memberId is null
            ? database.Accounts
            : database.Accounts.Where(account => account.RetiredAtUtc == null &&
                database.MemberAccountAssignments.Any(assignment =>
                    assignment.UserId == memberId && assignment.AccountId == account.Id));
    }
}