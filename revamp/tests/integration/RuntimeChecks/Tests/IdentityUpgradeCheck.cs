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

            var sampleId = Guid.NewGuid().ToString();
            database.FoundationStates.Add(new FoundationState
            {
                Id = 1,
                SampleId = sampleId,
                InitializedAtUtc = DateTimeOffset.UtcNow
            });

            await database.SaveChangesAsync();

            await migrator.MigrateAsync();

            var preserved = await database.FoundationStates
                .AsNoTracking()
                .SingleAsync();

            if (preserved.SampleId != sampleId ||
                await database.Users.AnyAsync() ||
                await database.AuditEvents.AnyAsync())
            {
                throw new InvalidOperationException("Identity upgrade did not preserve the foundation state.");
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