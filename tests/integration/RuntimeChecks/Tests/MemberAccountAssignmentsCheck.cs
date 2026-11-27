using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Users;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;
using PocketMonkey.Storage.Entities;

namespace RuntimeChecks.Tests;

internal static class MemberAccountAssignmentsCheck
{
    public static async Task RunAsync()
    {
        var root = Path.Combine(Path.GetTempPath(), $"member-assignments-{Guid.NewGuid():N}");
        Directory.CreateDirectory(root);
        var settings = new InstanceSettings { DataPath = root, Timezone = "UTC", DefaultLocale = "en-US" };
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<PocketMonkeyDbContext>(options => options.UseSqlite(settings.ConnectionString));
        services.AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<PocketMonkeyDbContext>();

        try
        {
            await using var provider = services.BuildServiceProvider();
            await using var scope = provider.CreateAsyncScope();
            var database = scope.ServiceProvider.GetRequiredService<PocketMonkeyDbContext>();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var migrator = database.Database.GetService<IMigrator>();
            await migrator.MigrateAsync("20261028171100_AccountLifecycle");
            Require((await roles.CreateAsync(new IdentityRole("Member"))).Succeeded, "create Member role");
            Require((await roles.CreateAsync(new IdentityRole("Manager"))).Succeeded, "create Manager role");
            var member = new ApplicationUser { UserName = "member", DisplayName = "Member", IsActive = false };
            var manager = new ApplicationUser { UserName = "manager", DisplayName = "Manager" };
            Require((await users.CreateAsync(member)).Succeeded && (await users.AddToRoleAsync(member, "Member")).Succeeded, "create Member");
            Require((await users.CreateAsync(manager)).Succeeded && (await users.AddToRoleAsync(manager, "Manager")).Succeeded, "create Manager");
            var first = new Account { Name = "First", NormalizedName = "FIRST", BalanceMinorUnits = 1234 };
            var second = new Account { Name = "Second", NormalizedName = "SECOND" };
            database.Accounts.AddRange(first, second);
            await database.SaveChangesAsync();

            await migrator.MigrateAsync();
            Require(await database.Users.CountAsync() == 2, "preserve users on upgrade");
            Require(await database.Accounts.CountAsync() == 2 && first.BalanceMinorUnits == 1234, "preserve accounts on upgrade");
            Require(!await database.MemberAccountAssignments.AnyAsync(), "upgrade begins without assignments");
            Require(await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM pragma_foreign_key_check").SingleAsync() == 0,
                "foreign keys after upgrade");

            var assignments = new MemberAccountAssignments(database, users);
            var administration = new AccountAdministration(database, settings);
            var ledger = new LedgerAdministration(database, settings, TimeProvider.System);
            var allowance = new AllowanceAdministration(database, settings, TimeProvider.System);
            var images = new AccountImages(database, settings, NullLogger<AccountImages>.Instance);
            Require((await assignments.GetAsync(member.Id, default)).Response!.AccountIds.Count == 0, "empty Member set");
            Require((await assignments.GetAsync(manager.Id, default)).Error == "assignment_target_not_member", "reject Manager target");
            Require((await administration.ListAsync(default, member.Id)).Count == 0, "unassigned list is empty");
            Require(await administration.FindAsync(first.Id, default, member.Id) is null, "unassigned account hidden");

            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [first.Id] }, default)).Error is null,
                "assign account to disabled Member");
            Require((await administration.ListAsync(default, member.Id)).Single().Id == first.Id, "assigned account visible");
            Require(await administration.FindAsync(first.Id, default, member.Id) is not null, "assigned account readable");
            Require((await ledger.HistoryAsync(second.Id, 20, null, default, member.Id)).Error == LedgerError.NotFound, "history hidden");
            Require(await allowance.FindAsync(second.Id, default, false, member.Id) is null, "allowance hidden");
            Require(await images.OpenAsync(second.Id, default, member.Id) is null, "image hidden");
            Require(await administration.FindAsync(second.Id, default) is not null, "Manager account readable");

            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [first.Id, first.Id] }, default)).Error == "invalid_account_assignments",
                "reject duplicates");
            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [Guid.NewGuid().ToString()] }, default)).Error == "not_found",
                "reject missing account");
            Require((await assignments.GetAsync(member.Id, default)).Response!.AccountIds.SequenceEqual([first.Id]), "invalid saves preserve set");
            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [second.Id] }, default)).Error is null,
                "later replacement wins");
            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [second.Id] }, default)).Error is null,
                "unchanged replacement succeeds");
            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [first.Id] }, default)).Error is null,
                "opposite replacement order wins");
            Require((await assignments.GetAsync(member.Id, default)).Response!.AccountIds.SequenceEqual([first.Id]), "last valid set persists");

            await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER RejectAssignment BEFORE INSERT ON MemberAccountAssignments BEGIN SELECT RAISE(ABORT, 'fixture failure'); END;");

            try
            {
                await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [second.Id] }, default);
                throw new InvalidOperationException("Assignment replacement should have failed.");
            }
            catch (DbUpdateException)
            {
            }

            database.ChangeTracker.Clear();
            Require((await assignments.GetAsync(member.Id, default)).Response!.AccountIds.SequenceEqual([first.Id]), "failed replacement rolls back");
            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER RejectAssignment;");

            async Task<string?> ReplaceFromSeparateScopeAsync(string accountId)
            {
                await using var separateScope = provider.CreateAsyncScope();
                var separateDatabase = separateScope.ServiceProvider.GetRequiredService<PocketMonkeyDbContext>();
                var separateUsers = separateScope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var separateAssignments = new MemberAccountAssignments(separateDatabase, separateUsers);
                return (await separateAssignments.ReplaceAsync(member.Id,
                    new UpdateMemberAccountAssignmentsRequest { AccountIds = [accountId] }, default)).Error;
            }

            var concurrent = await Task.WhenAll(
                Task.Run(() => ReplaceFromSeparateScopeAsync(first.Id)),
                Task.Run(() => ReplaceFromSeparateScopeAsync(second.Id)));
            Require(concurrent.All(error => error is null), "concurrent replacements succeed");
            var current = (await assignments.GetAsync(member.Id, default)).Response!.AccountIds;
            Require(current.SequenceEqual([first.Id]) || current.SequenceEqual([second.Id]), "concurrent result is a complete replacement");

            member = (await users.FindByIdAsync(member.Id))!;
            Require((await users.RemoveFromRoleAsync(member, "Member")).Succeeded && (await users.AddToRoleAsync(member, "Manager")).Succeeded,
                "promote Member");
            Require((await assignments.GetAsync(member.Id, default)).Error == "assignment_target_not_member", "promoted user is not editable");
            Require(await database.MemberAccountAssignments.AnyAsync(assignment => assignment.UserId == member.Id), "promotion retains assignments");
            Require((await users.RemoveFromRoleAsync(member, "Manager")).Succeeded && (await users.AddToRoleAsync(member, "Member")).Succeeded,
                "restore Member role");

            var retiredAccount = await database.Accounts.SingleAsync(account => account.Id == first.Id);
            retiredAccount.RetiredAtUtc = DateTimeOffset.UtcNow;
            await database.SaveChangesAsync();
            Require((await assignments.ReplaceAsync(member.Id, new UpdateMemberAccountAssignmentsRequest { AccountIds = [first.Id] }, default)).Error == "account_not_assignable",
                "reject retired account");
            Require(await administration.FindAsync(first.Id, default, member.Id) is null, "retired account hidden");
            Require((await administration.DeleteAsync(second.Id, manager.Id, default)).Error is null, "delete account");

            Console.WriteLine("member_account_assignments_passed");
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            Directory.Delete(root, true);
        }
    }

    private static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }
}