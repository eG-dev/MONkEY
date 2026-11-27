using System.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Contracts.Users;
using PocketMonkey.Host.Identity;
using PocketMonkey.Storage;
using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Host.Services;

public sealed class MemberAccountAssignments
{
    private readonly PocketMonkeyDbContext database;
    private readonly UserManager<ApplicationUser> users;

    public MemberAccountAssignments(PocketMonkeyDbContext database, UserManager<ApplicationUser> users)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.users = users ?? throw new ArgumentNullException(nameof(users));
    }

    public async Task<(MemberAccountAssignmentsResponse? Response, string? Error)> GetAsync(
        string userId, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var error = await ValidateTargetAsync(userId);

        if (error is not null)
        {
            return (null, error);
        }

        var accountIds = await database.MemberAccountAssignments.AsNoTracking()
            .Where(assignment => assignment.UserId == userId)
            .OrderBy(assignment => assignment.AccountId)
            .Select(assignment => assignment.AccountId)
            .ToListAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return (new MemberAccountAssignmentsResponse { AccountIds = accountIds }, null);
    }

    public async Task<(MemberAccountAssignmentsResponse? Response, string? Error)> ReplaceAsync(
        string userId, UpdateMemberAccountAssignmentsRequest? request, CancellationToken cancellationToken)
    {
        if (request?.AccountIds is null)
        {
            return (null, "invalid_account_assignments");
        }

        var accountIds = new HashSet<string>(StringComparer.Ordinal);

        foreach (var accountId in request.AccountIds)
        {
            if (!Guid.TryParseExact(accountId, "D", out var parsedId) || !accountIds.Add(parsedId.ToString()))
            {
                return (null, "invalid_account_assignments");
            }
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var error = await ValidateTargetAsync(userId);

        if (error is not null)
        {
            return (null, error);
        }

        var accounts = await database.Accounts.AsNoTracking()
            .Where(account => accountIds.Contains(account.Id))
            .Select(account => new { account.Id, account.RetiredAtUtc })
            .ToListAsync(cancellationToken);

        if (accounts.Count != accountIds.Count)
        {
            return (null, "not_found");
        }

        if (accounts.Any(account => account.RetiredAtUtc is not null))
        {
            return (null, "account_not_assignable");
        }

        var existing = await database.MemberAccountAssignments
            .Where(assignment => assignment.UserId == userId)
            .ToListAsync(cancellationToken);
        var existingIds = existing.Select(assignment => assignment.AccountId).ToHashSet(StringComparer.Ordinal);
        database.MemberAccountAssignments.RemoveRange(existing.Where(assignment => !accountIds.Contains(assignment.AccountId)));
        database.MemberAccountAssignments.AddRange(accountIds.Except(existingIds).Select(accountId => new MemberAccountAssignment
        {
            UserId = userId,
            AccountId = accountId
        }));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return (new MemberAccountAssignmentsResponse { AccountIds = accountIds.Order(StringComparer.Ordinal).ToList() }, null);
    }

    private async Task<string?> ValidateTargetAsync(string userId)
    {
        var user = await users.FindByIdAsync(userId);

        if (user is null)
        {
            return "not_found";
        }

        return await users.IsInRoleAsync(user, UserRole.Member.ToIdentityName())
            ? null
            : "assignment_target_not_member";
    }
}