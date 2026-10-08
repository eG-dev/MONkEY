using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Contracts.Accounts;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

namespace RuntimeChecks.Tests;

internal static class LedgerPersistenceCheck
{
    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"ledger-persistence-{Guid.NewGuid():N}.db");
        var settings = new InstanceSettings { DataPath = Path.GetDirectoryName(path)!, Timezone = "UTC", DefaultLocale = "de-DE" };
        var options = new DbContextOptionsBuilder<FoundationDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True")
            .Options;

        try
        {
            await using (var database = new FoundationDbContext(options))
            {
                var previous = database.Database.GetMigrations().Single(migration => migration.EndsWith("_SharedAccounts"));
                await database.GetService<IMigrator>().MigrateAsync(previous);
                await database.Database.ExecuteSqlRawAsync("INSERT INTO Accounts (Id, Name, NormalizedName) VALUES ('existing', 'Existing', 'EXISTING')");
                await database.Database.MigrateAsync();

                if ((await database.Accounts.SingleAsync()).BalanceMinorUnits is not null || await database.LedgerEntries.AnyAsync())
                {
                    throw new InvalidOperationException("Migration silently initialized an existing account.");
                }

                database.Users.Add(new ApplicationUser { Id = "probe-manager", UserName = "probe", DisplayName = "Historical Manager" });
                database.Accounts.Add(new Account { Id = "maximum", Name = "Maximum", NormalizedName = "MAXIMUM" });
                database.Accounts.Add(new Account { Id = "rollback", Name = "Rollback", NormalizedName = "ROLLBACK" });
                await database.SaveChangesAsync();
            }

            if (!CurrencyAmount.TryParse("0.10", out var first) || !CurrencyAmount.TryParse("0.20", out var second) ||
                CurrencyAmount.Format(checked(first + second)) != "0.30" ||
                !CurrencyAmount.TryParse("92233720368547758.07", out var maximum) || maximum != long.MaxValue ||
                CurrencyAmount.TryParse("92233720368547758.08", out _) || CurrencyAmount.TryParse("1.001", out _) ||
                CurrencyAmount.TryParse("-0.01", out _) || CurrencyAmount.TryParse("1e2", out _))
            {
                throw new InvalidOperationException("Exact monetary parsing, arithmetic, or range validation failed.");
            }

            var opening = new OpeningBalanceRequest { Amount = "0.00", IdempotencyKey = Guid.NewGuid().ToString() };

            await using (var database = new FoundationDbContext(options))
            {
                var administration = new OpeningBalanceAdministration(database, settings);
                var posted = await administration.PostAsync("existing", opening, "probe-manager", default);
                var repeated = await administration.PostAsync("existing", opening, "probe-manager", default);
                var limit = await administration.PostAsync("maximum", new OpeningBalanceRequest
                {
                    Amount = "92233720368547758.07",
                    IdempotencyKey = Guid.NewGuid().ToString()
                }, "probe-manager", default);

                if (posted.Error is not null || repeated.Entry?.Id != posted.Entry?.Id || repeated.Error is not null ||
                    limit.Entry?.Amount != "92233720368547758.07" || posted.Entry?.ActorDisplayName != "Historical Manager")
                {
                    throw new InvalidOperationException("Zero/maximum posting or idempotent replay failed.");
                }
            }

            await using (var database = new FoundationDbContext(options))
            {
                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER probe_fail_opening BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'opening_posted' BEGIN SELECT RAISE(ABORT, 'probe'); END;");
                var failed = false;

                try
                {
                    await new OpeningBalanceAdministration(database, settings).PostAsync("rollback", new OpeningBalanceRequest
                    {
                        Amount = "12.34",
                        IdempotencyKey = Guid.NewGuid().ToString()
                    }, "probe-manager", default);
                }
                catch (DbUpdateException)
                {
                    failed = true;
                }

                if (!failed)
                {
                    throw new InvalidOperationException("The injected persistence failure did not fail posting.");
                }
            }

            await using (var database = new FoundationDbContext(options))
            {
                var openingEntries = await database.LedgerEntries
                    .Where(entry => entry.Source == LedgerEntrySource.Opening)
                    .ToListAsync();

                if (await database.LedgerEntries.CountAsync() != 2 || openingEntries.Count != 2 ||
                    openingEntries.Any(entry => entry.Source != LedgerEntrySource.Opening) || await database.AuditEvents.CountAsync() != 2 ||
                    (await database.Accounts.FindAsync("rollback"))!.BalanceMinorUnits is not null ||
                    (await database.Accounts.FindAsync("maximum"))!.BalanceMinorUnits != long.MaxValue)
                {
                    throw new InvalidOperationException("Posting failure left partial ledger, balance, or audit changes.");
                }

                await database.Database.ExecuteSqlRawAsync("DROP TRIGGER probe_fail_opening");
                database.LedgerEntries.Add(new LedgerEntry
                {
                    AccountId = "rollback",
                    AmountMinorUnits = -1,
                    IdempotencyKey = Guid.NewGuid().ToString(),
                    ActorId = "probe-manager",
                    ActorDisplayName = "Historical Manager",
                    OccurredAtUtc = DateTimeOffset.UtcNow
                });
                var rejected = false;

                try
                {
                    await database.SaveChangesAsync();
                }
                catch (DbUpdateException exception) when (exception.InnerException is SqliteException { SqliteExtendedErrorCode: 275 })
                {
                    rejected = true;
                }

                if (!rejected)
                {
                    throw new InvalidOperationException("The database accepted a negative ledger amount.");
                }
            }

            Console.WriteLine("ledger_persistence_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(path);
        }
    }
}