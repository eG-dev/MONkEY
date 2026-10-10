using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Storage;

namespace RuntimeChecks.Tests;

internal static class IdentityUpgradeCheck
{
    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"identity-upgrade-{Guid.NewGuid():N}.db");

        try
        {
            var options = new DbContextOptionsBuilder<FoundationDbContext>()
                .UseSqlite($"Data Source={path};Foreign Keys=True")
                .Options;
            await using var database = new FoundationDbContext(options);
            var migrator = database.Database.GetService<IMigrator>();

            await migrator.MigrateAsync(
                database.Database
                    .GetMigrations()
                    .First());

            await database.Database.ExecuteSqlRawAsync(
                "INSERT INTO FoundationState (Id, SampleId, InitializedAtUtc) VALUES (1, 'upgrade-sample', '2026-10-10T00:00:00Z')");
            await migrator.MigrateAsync("20261010085457_UserTheme");

            var account = new Account { Name = "Upgrade account", NormalizedName = "UPGRADE ACCOUNT", BalanceMinorUnits = 1234 };
            database.Accounts.Add(account);
            await database.SaveChangesAsync();

            await migrator.MigrateAsync();

            var preserved = await database.Accounts.AsNoTracking().SingleAsync();
            var demoTables = await database.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM sqlite_master WHERE type = 'table' AND name = 'FoundationState'")
                .SingleAsync();

            if (demoTables != 0 || preserved.Id != account.Id || preserved.BalanceMinorUnits != 1234 ||
                await database.Users.AnyAsync() ||
                await database.AuditEvents.AnyAsync())
            {
                throw new InvalidOperationException("Demo removal did not preserve the application schema and account data.");
            }

            Console.WriteLine("identity_upgrade_passed");
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            File.Delete(path);
        }
    }
}