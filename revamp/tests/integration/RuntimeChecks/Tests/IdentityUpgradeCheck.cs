using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
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

            // Raw SQL because the current entity model contains columns added by later migrations.
            const string accountId = "6f1c9a52-7d2e-4b8a-9c3f-0a1b2c3d4e5f";
            await database.Database.ExecuteSqlRawAsync(
                "INSERT INTO Accounts (Id, Name, NormalizedName, BalanceMinorUnits) VALUES ({0}, 'Upgrade account', 'UPGRADE ACCOUNT', 1234)",
                accountId);

            await migrator.MigrateAsync();

            var preserved = await database.Accounts.AsNoTracking().SingleAsync();
            var demoTables = await database.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM sqlite_master WHERE type = 'table' AND name = 'FoundationState'")
                .SingleAsync();

            if (demoTables != 0 || preserved.Id != accountId || preserved.BalanceMinorUnits != 1234 ||
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