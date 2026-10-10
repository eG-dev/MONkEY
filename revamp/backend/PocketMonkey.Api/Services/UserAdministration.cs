using System.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Contracts.Authentication;
using PocketMonkey.Api.Contracts.Users;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Identity;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Services;

public sealed class UserAdministration
{
    private readonly FoundationDbContext database;
    private readonly UserManager<ApplicationUser> users;
    private readonly InstanceSettings settings;

    public UserAdministration(FoundationDbContext database, UserManager<ApplicationUser> users, InstanceSettings settings)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.users = users ?? throw new ArgumentNullException(nameof(users));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public async Task<SessionResponse> DescribeAsync(ApplicationUser user)
    {
        ArgumentNullException.ThrowIfNull(user);

        return new SessionResponse
        {
            Id = user.Id,
            Username = user.UserName!,
            DisplayName = user.DisplayName,
            Role = await users.IsInRoleAsync(user, UserRole.Manager.ToIdentityName()) ? UserRole.Manager : UserRole.Member,
            Language = user.Language,
            Theme = user.Theme,
            MustChangePassword = user.MustChangePassword
        };
    }

    public async Task<UserAdministrationError?> CreateAsync(
        CreateUserRequest request,
        string actor,
        bool bootstrap,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!ValidName(request.Username) || !ValidName(request.DisplayName) || !ValidPassword(request.Password) ||
            request.Role is not { } role || !Enum.IsDefined(role))
        {
            return UserAdministrationError.InvalidUser;
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        if (bootstrap && await database.Users.AnyAsync(cancellationToken))
        {
            return UserAdministrationError.AlreadyInitialized;
        }

        var user = new ApplicationUser
        {
            UserName = request.Username.Trim(),
            DisplayName = request.DisplayName.Trim(),
            Language = settings.DefaultLocale == "en-GB" ? "en" : "de",
            MustChangePassword = !bootstrap
        };

        var result = await users.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return UserAdministrationError.InvalidUser;
        }

        result = await users.AddToRoleAsync(user, role.ToIdentityName());

        if (!result.Succeeded)
        {
            return UserAdministrationError.InvalidUser;
        }

        AddAudit(actor, user.Id, bootstrap ? "manager_bootstrapped" : "user_created");
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return null;
    }

    public async Task<UserAdministrationError?> UpdateAsync(
        string id,
        UpdateUserRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        if (!ValidName(request.DisplayName) || request.Role is not { } role || !Enum.IsDefined(role))
        {
            return UserAdministrationError.InvalidUser;
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var user = await users.FindByIdAsync(id);

        if (user is null)
        {
            return UserAdministrationError.NotFound;
        }

        var managerRoleName = UserRole.Manager.ToIdentityName();
        var wasManager = await users.IsInRoleAsync(user, managerRoleName);

        if (user.IsActive && wasManager && (!request.IsActive || role != UserRole.Manager))
        {
            var managerRole = await database.Roles.SingleAsync(x => x.Name == managerRoleName, cancellationToken);

            var activeManagers = await database.UserRoles
                .Where(membership => membership.RoleId == managerRole.Id)
                .Join(
                    database.Users.Where(account => account.IsActive),
                    membership => membership.UserId,
                    account => account.Id,
                    (membership, account) => account.Id)
                .CountAsync(cancellationToken);

            if (activeManagers <= 1)
            {
                return UserAdministrationError.LastManager;
            }
        }

        var currentRoles = await users.GetRolesAsync(user);
        var roleName = role.ToIdentityName();

        if (!currentRoles.Contains(roleName))
        {
            if (!(await users.RemoveFromRolesAsync(user, currentRoles)).Succeeded ||
            !(await users.AddToRoleAsync(user, roleName)).Succeeded)
            {
                return UserAdministrationError.InvalidUser;
            }
        }

        user.DisplayName = request.DisplayName.Trim();
        user.IsActive = request.IsActive;

        if (!(await users.UpdateSecurityStampAsync(user)).Succeeded)
        {
            return UserAdministrationError.InvalidUser;
        }

        AddAudit(actor, id, "user_updated");
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return null;
    }

    public async Task<UserAdministrationError?> ResetAsync(
        string id,
        string password,
        string actor,
        bool recovery,
        CancellationToken cancellationToken)
    {
        if (!ValidPassword(password))
        {
            return UserAdministrationError.InvalidPassword;
        }

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var user = await users.FindByIdAsync(id);

        if (user is null || (recovery && !await users.IsInRoleAsync(user, UserRole.Manager.ToIdentityName())))
        {
            return UserAdministrationError.NotFound;
        }

        var token = await users.GeneratePasswordResetTokenAsync(user);

        if (!(await users.ResetPasswordAsync(user, token, password)).Succeeded)
        {
            return UserAdministrationError.InvalidPassword;
        }

        user.MustChangePassword = true;

        if (recovery)
        {
            user.IsActive = true;
            user.LockoutEnd = null;
            user.AccessFailedCount = 0;
        }

        if (!(await users.UpdateAsync(user)).Succeeded)
        {
            return UserAdministrationError.InvalidUser;
        }

        AddAudit(actor, id, recovery ? "manager_recovered" : "password_reset");
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return null;
    }

    public void AddAudit(string actor, string subject, string action)
    {
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor,
            SubjectId = subject,
            Action = action,
            OccurredAtUtc = DateTimeOffset.UtcNow
        });
    }

    public static bool ValidPassword(string? value) => value is { Length: >= 12 and <= 256 };

    private static bool ValidName(string? value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 100;
}