using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

namespace RuntimeChecks.Tests;

internal static class AllowancePersistenceCheck
{
    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"allowance-{Guid.NewGuid():N}.db");
        var settings = new InstanceSettings { DataPath = Path.GetDirectoryName(path)!, Timezone = "Europe/Berlin", DefaultLocale = "en-US" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite($"Data Source={path};Foreign Keys=True;Default Timeout=30").Options;
        var clock = new ControlledClock { Now = DateTimeOffset.Parse("2026-09-30T21:59:59Z") };
        string accountId;
        string firstRevision;

        try
        {
            await using (var database = new PocketMonkeyDbContext(options))
            {
                await database.Database.MigrateAsync();
                database.Users.Add(new ApplicationUser { Id = "manager", UserName = "manager", DisplayName = "Manager" });
                await database.SaveChangesAsync();
                var accounts = new AccountAdministration(database, settings);
                var account = await accounts.CreateAsync(new CreateAccountRequest { Name = "Allowance" }, "manager", default);
                accountId = account.Account!.Id;
                var allowance = new AllowanceAdministration(database, settings, clock);
                var rejected = await allowance.SaveAsync(accountId, new AllowanceRequest { Enabled = true, Amount = "12.34" }, "manager", default);
                Require(rejected.Error == "not_initialized", "Uninitialized account accepted an enabled allowance.");
                await new LedgerAdministration(database, settings).PostOpeningAsync(accountId,
                    new OpeningBalanceRequest { Amount = "0", IdempotencyKey = Guid.NewGuid().ToString() }, "manager", default);

                var saved = await allowance.SaveAsync(accountId, new AllowanceRequest { Enabled = true, Amount = "12.34" }, "manager", default);
                Require(saved.Error is null && saved.Configuration!.BusinessMonth == "2026-09" &&
                    saved.Configuration.Scheduled!.EffectiveMonth == "2026-10" && saved.Configuration.Current is null,
                    "Business timezone or next-month configuration was incorrect.");
                firstRevision = saved.Configuration!.LatestRevisionId!;
                var replay = await allowance.SaveAsync(accountId, new AllowanceRequest { Enabled = true, Amount = "12.34" }, "manager", default);
                Require(replay.Error is null && await database.AllowanceRevisions.CountAsync() == 1, "Retry duplicated configuration.");
                Require(await database.LedgerEntries.CountAsync() == 1, "Configuration created a ledger credit.");
            }

            clock.Now = DateTimeOffset.Parse("2026-09-30T22:00:00Z");

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var allowance = new AllowanceAdministration(database, settings, clock);
                var state = await allowance.FindAsync(accountId, default);
                Require(state!.Current!.Amount == "12.34" && state.Scheduled is null && state.NextEffectiveMonth == "2026-11",
                    "Local month boundary did not activate the revision.");
                var disabled = await allowance.SaveAsync(accountId,
                    new AllowanceRequest { Enabled = false, Amount = "999", ExpectedRevisionId = firstRevision }, "manager", default);
                Require(disabled.Configuration!.Current!.Enabled && !disabled.Configuration.Scheduled!.Enabled &&
                    disabled.Configuration.Scheduled.Amount == "12.34", "Disabling changed the current month or lost the amount.");
                var conflict = await allowance.SaveAsync(accountId,
                    new AllowanceRequest { Enabled = true, Amount = "99", ExpectedRevisionId = firstRevision }, "manager", default);
                Require(conflict.Error == "allowance_conflict", "Stale edit was not rejected.");

                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER FailAllowanceAudit BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'allowance_configured' BEGIN SELECT RAISE(ABORT, 'audit failure'); END;");
                var rejected = false;

                try
                {
                    await allowance.SaveAsync(accountId, new AllowanceRequest
                    {
                        Enabled = true, Amount = "13", ExpectedRevisionId = disabled.Configuration.LatestRevisionId
                    }, "manager", default);
                }
                catch (DbUpdateException)
                {
                    rejected = true;
                }

                Require(rejected, "Audit failure was not exercised.");
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                Require(await database.AllowanceRevisions.CountAsync() == 2 &&
                    await database.AuditEvents.CountAsync(audit => audit.Action == "allowance_configured") == 2,
                    "Audit rollback left a partial revision.");
                await database.Database.ExecuteSqlRawAsync("DROP TRIGGER FailAllowanceAudit;");
                var invalid = new AllowanceRevision
                {
                    AccountId = accountId, PreviousRevisionId = "invalid", ActorId = "manager",
                    EffectiveMonth = 202613, Enabled = true, AmountMinorUnits = -1
                };
                database.AllowanceRevisions.Add(invalid);
                var rejected = false;

                try
                {
                    await database.SaveChangesAsync();
                }
                catch (DbUpdateException exception) when (exception.InnerException is SqliteException { SqliteExtendedErrorCode: 275 })
                {
                    rejected = true;
                }

                Require(rejected, "Allowance database constraints did not reject invalid data.");
            }

            clock.Now = DateTimeOffset.Parse("2026-12-31T23:00:00Z");

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var state = await new AllowanceAdministration(database, settings, clock).FindAsync(accountId, default);
                Require(state!.BusinessMonth == "2027-01" && state.NextEffectiveMonth == "2027-02" && !state.Current!.Enabled,
                    "Year boundary or disabled-period configuration was incorrect.");
                Require(await database.LedgerEntries.CountAsync() == 1 && await database.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 0,
                    "Configuration modified financial history.");
            }

            Console.WriteLine("allowance_persistence_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(path);
            File.Delete(path + "-wal");
            File.Delete(path + "-shm");
        }
    }

    private static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }

    private sealed class ControlledClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; }
        public override DateTimeOffset GetUtcNow() => Now;
    }
}