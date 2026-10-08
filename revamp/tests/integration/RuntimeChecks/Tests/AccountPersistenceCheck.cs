using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Contracts.Accounts;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

namespace RuntimeChecks.Tests;

internal static class AccountPersistenceCheck
{
    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"account-persistence-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<FoundationDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True")
            .Options;

        try
        {
            string secondId;

            await using (var database = new FoundationDbContext(options))
            {
                await database.Database.MigrateAsync();

                var administration = new AccountAdministration(database);
                var first = await administration.CreateAsync(new CreateAccountRequest { Name = "First" }, "probe-manager", default);
                var second = await administration.CreateAsync(new CreateAccountRequest { Name = "Second" }, "probe-manager", default);

                if (first.Error is not null || second.Error is not null)
                {
                    throw new InvalidOperationException("Account setup failed.");
                }

                secondId = second.Account?.Id ?? throw new InvalidOperationException("Account identity was not returned.");
            }

            await using (var database = new FoundationDbContext(options))
            {
                var administration = new AccountAdministration(database);

                var duplicate = await administration.CreateAsync(new CreateAccountRequest { Name = "FIRST" }, "probe-manager", default);

                if (duplicate.Error != AccountError.DuplicateName)
                {
                    throw new InvalidOperationException("Duplicate creation did not produce the expected conflict.");
                }
            }

            await using (var database = new FoundationDbContext(options))
            {
                var administration = new AccountAdministration(database);

                var duplicate = await administration.UpdateAsync(
                    secondId,
                    new UpdateAccountRequest { Name = "first" },
                    "probe-manager",
                    default);

                if (duplicate.Error != AccountError.DuplicateName)
                {
                    throw new InvalidOperationException("Duplicate rename did not produce the expected conflict.");
                }
            }

            await using (var database = new FoundationDbContext(options))
            {
                var names = await database.Accounts
                    .OrderBy(account => account.Name)
                    .Select(account => account.Name)
                    .ToArrayAsync();

                if (!names.SequenceEqual(["First", "Second"]) || await database.AuditEvents.CountAsync() != 2)
                {
                    throw new InvalidOperationException("A rejected account write left partial account or audit changes.");
                }
            }

            await using (var database = new FoundationDbContext(options))
            {
                database.Accounts.Add(new Account
                {
                    Name = new string('A', 41),
                    NormalizedName = new string('A', 41)
                });

                var rejected = false;

                try
                {
                    await database.SaveChangesAsync();
                }
                catch (DbUpdateException exception) when (
                    exception.InnerException is SqliteException { SqliteExtendedErrorCode: 275 })
                {
                    rejected = true;
                }

                if (!rejected)
                {
                    throw new InvalidOperationException("The database accepted an account name longer than 40 characters.");
                }
            }

            Console.WriteLine("account_persistence_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(path);
        }
    }
}