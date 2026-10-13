using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Logging.Abstractions;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

namespace RuntimeChecks.Tests;

internal static class AllowanceExecutionCheck
{
    public static async Task ConfigureFixtureAsync(string path, string accountId, string mode)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        ArgumentException.ThrowIfNullOrWhiteSpace(accountId);
        Require(mode is "seed-interrupted" or "seed-failure" or "remove-failure", "Unknown allowance fixture mode.");

        var settings = new InstanceSettings
        {
            DataPath = Path.GetDirectoryName(path)!, Timezone = "Europe/Berlin", DefaultLocale = "en-US"
        };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite(settings.ConnectionString).Options;
        await using var database = new PocketMonkeyDbContext(options);
        Require(await database.Accounts.AnyAsync(account => account.Id == accountId), "Fixture account is missing.");

        if (mode == "remove-failure")
        {
            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER FailExecutionAudit;");
        }
        else
        {
            var timezone = TimeZoneInfo.FindSystemTimeZoneById(settings.Timezone);
            var local = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, timezone);
            var historicalMonth = new DateTime(local.Year, local.Month, 1).AddMonths(-2);
            var actor = await database.LedgerEntries
                .Where(entry => entry.AccountId == accountId && entry.Source == LedgerEntrySource.Opening)
                .Select(entry => entry.ActorId).SingleAsync();
            var clock = new ControlledClock { Now = TimeZoneInfo.ConvertTimeToUtc(historicalMonth, timezone) };
            var revision = new AllowanceRevision
            {
                AccountId = accountId, PreviousRevisionId = "", ActorId = actor, Enabled = true,
                AmountMinorUnits = 125, EffectiveMonth = historicalMonth.Year * 100 + historicalMonth.Month,
                OccurredAtUtc = clock.Now.AddMonths(-1)
            };
            database.AllowanceRevisions.Add(revision);
            await database.SaveChangesAsync();

            await new AllowanceExecutor(database, new LedgerAdministration(database, settings), settings,
                clock, NullLogger<AllowanceExecutor>.Instance).RunAsync(default);

            var interruptedMonth = historicalMonth.AddMonths(1);
            database.AllowanceExecutions.Add(new AllowanceExecution
            {
                AccountId = accountId, BusinessMonth = interruptedMonth.Year * 100 + interruptedMonth.Month,
                RevisionId = revision.Id, IdempotencyKey = Guid.NewGuid().ToString(), Attempts = 1,
                LastAttemptAtUtc = clock.Now.AddMonths(1)
            });
            await database.SaveChangesAsync();

            if (mode == "seed-failure")
            {
                database.AllowanceRevisions.Add(new AllowanceRevision
                {
                    AccountId = accountId, PreviousRevisionId = revision.Id, ActorId = actor,
                    Enabled = false, AmountMinorUnits = 125, EffectiveMonth = local.Year * 100 + local.Month,
                    OccurredAtUtc = clock.Now.AddMonths(1)
                });
                await database.SaveChangesAsync();
                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER FailExecutionAudit BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'allowance_posted' BEGIN SELECT RAISE(ABORT, 'fixture audit failure'); END;");
            }
        }

        Console.WriteLine("allowance_fixture_ready");
    }

    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"execution-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True;Default Timeout=30").Options;
        var settings = new InstanceSettings { DataPath = Path.GetDirectoryName(path)!, Timezone = "Europe/Berlin", DefaultLocale = "en-US" };
        var clock = new ControlledClock { Now = DateTimeOffset.Parse("2026-09-30T21:59:59Z") };
        string accountId;

        async Task ScanAsync(InstanceSettings? overrideSettings = null)
        {
            await using var database = new PocketMonkeyDbContext(options);
            var selectedSettings = overrideSettings ?? settings;
            await new AllowanceExecutor(database, new LedgerAdministration(database, selectedSettings), selectedSettings,
                clock, NullLogger<AllowanceExecutor>.Instance).RunAsync(default);
        }

        try
        {
            await using (var database = new PocketMonkeyDbContext(options))
            {
                await database.GetService<IMigrator>().MigrateAsync("20261010203039_AllowanceConfiguration");
                database.Users.Add(new ApplicationUser { Id = "manager", UserName = "manager", DisplayName = "Manager" });
                await database.SaveChangesAsync();
                var created = await new AccountAdministration(database, settings)
                    .CreateAsync(new CreateAccountRequest { Name = "Execution" }, "manager", default);
                accountId = created.Account!.Id;
                await database.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO LedgerEntries (Id, AccountId, AmountMinorUnits, SequenceNumber, IdempotencyKey, ActorId, ActorDisplayName, OccurredAtUtc, Source) VALUES ({Guid.NewGuid().ToString()}, {accountId}, 1000, 1, {Guid.NewGuid().ToString()}, 'manager', 'Manager', {clock.Now.ToString("O")}, 'opening')");
                await database.Accounts.Where(account => account.Id == accountId)
                    .ExecuteUpdateAsync(update => update.SetProperty(account => account.BalanceMinorUnits, 1000));

                string previous = "";

                foreach (var configuration in new[]
                {
                    (Month: 202610, Enabled: true, Amount: 125L),
                    (Month: 202611, Enabled: true, Amount: 200L),
                    (Month: 202612, Enabled: false, Amount: 200L),
                    (Month: 202703, Enabled: true, Amount: 300L),
                    (Month: 202702, Enabled: true, Amount: 400L)
                })
                {
                    var revision = new AllowanceRevision
                    {
                        AccountId = accountId, PreviousRevisionId = previous, ActorId = "manager",
                        EffectiveMonth = configuration.Month, Enabled = configuration.Enabled,
                        AmountMinorUnits = configuration.Amount, OccurredAtUtc = clock.Now
                    };
                    database.AllowanceRevisions.Add(revision);
                    previous = revision.Id;
                }

                await database.SaveChangesAsync();
                await database.Database.MigrateAsync();
            }

            await ScanAsync();

            await using (var database = new PocketMonkeyDbContext(options))
            {
                Require(!await database.AllowanceExecutions.AnyAsync(), "A future month was credited early.");
            }

            clock.Now = DateTimeOffset.Parse("2026-09-30T22:00:00Z");
            await ScanAsync();
            clock.Now = DateTimeOffset.Parse("2027-01-31T22:59:59Z");
            await ScanAsync();

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var entries = await database.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Allowance)
                    .OrderBy(entry => entry.SequenceNumber).ToListAsync();
                Require(entries.Count == 2 && entries[0].AllowanceMonth == 202610 && entries[0].AmountMinorUnits == 125 &&
                    entries[1].AllowanceMonth == 202611 && entries[1].AmountMinorUnits == 200,
                    "Catch-up did not use historical amounts or skip disabled months.");
                Require(entries.All(entry => entry.ActorId == "system:monthly-allowance") &&
                    await database.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 1325,
                    "System provenance or catch-up balance was incorrect.");
                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER FailExecutionAudit BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'allowance_posted' BEGIN SELECT RAISE(ABORT, 'audit failure'); END;");
            }

            clock.Now = DateTimeOffset.Parse("2027-01-31T23:00:00Z");
            await ScanAsync();

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var failed = await database.AllowanceExecutions.SingleAsync(execution => execution.BusinessMonth == 202702);
                Require(failed.CreditedAtUtc is null && failed.ErrorCode == "execution_failed" && failed.Attempts == 1,
                    "Failed execution was not durable and observable.");
                var status = await new AllowanceAdministration(database, settings, clock).FindAsync(accountId, default);
                Require(status!.LatestExecution!.BusinessMonth == "2026-11" && status.OutstandingExecution!.Status == "failed" &&
                    status.OutstandingExecution.Amount == "4.00", "Allowance read did not report historical execution and failure state.");
                Require(await database.LedgerEntries.CountAsync() == 3 &&
                    await database.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 1325,
                    "Audit failure left partial financial writes.");
                await database.Database.ExecuteSqlRawAsync("DROP TRIGGER FailExecutionAudit;");
            }

            await Task.WhenAll(Task.Run(() => ScanAsync()), Task.Run(() => ScanAsync()));
            await ScanAsync();

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var execution = await database.AllowanceExecutions.SingleAsync(candidate => candidate.BusinessMonth == 202702);
                var entry = await database.LedgerEntries.SingleAsync(candidate => candidate.AllowanceMonth == 202702);
                Require(execution.CreditedAtUtc == entry.OccurredAtUtc && execution.ErrorCode is null && execution.Attempts >= 2 &&
                    entry.AmountMinorUnits == 400 && await database.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 1725,
                    "Restart/retry/concurrency did not credit exactly once using the latest same-month revision.");
            }

            await ScanAsync(new InstanceSettings { DataPath = settings.DataPath, Timezone = "Pacific/Honolulu", Currency = "USD", DefaultLocale = "en-US" });
            clock.Now = DateTimeOffset.Parse("2027-03-31T22:00:00Z");

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var revision = await database.AllowanceRevisions.OrderByDescending(candidate => candidate.SequenceNumber).FirstAsync();
                database.AllowanceExecutions.Add(new AllowanceExecution
                {
                    AccountId = accountId, BusinessMonth = 202703, RevisionId = revision.Id,
                    IdempotencyKey = Guid.NewGuid().ToString(), Attempts = 1, LastAttemptAtUtc = clock.Now
                });
                await database.SaveChangesAsync();
            }

            await ScanAsync();
            await ScanAsync(new InstanceSettings { DataPath = settings.DataPath, Timezone = "Pacific/Honolulu", DefaultLocale = "en-US" });

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var entries = await database.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Allowance).ToListAsync();
                Require(entries.Count == 5 && entries.Select(entry => entry.AllowanceMonth).Distinct().Count() == 5 &&
                    entries.Single(entry => entry.AllowanceMonth == 202702).OccurredAtUtc == DateTimeOffset.Parse("2027-01-31T23:00:00Z") &&
                    await database.AuditEvents.CountAsync(audit => audit.Action == "allowance_posted") == 5,
                    "DST/year/currency/timezone changes replayed or rewrote history.");

                var created = await new AccountAdministration(database, settings)
                    .CreateAsync(new CreateAccountRequest { Name = "Overflow" }, "manager", default);
                var overflowId = created.Account!.Id;
                await new LedgerAdministration(database, settings).PostOpeningAsync(overflowId,
                    new OpeningBalanceRequest { Amount = "92233720368547758.07", IdempotencyKey = Guid.NewGuid().ToString() }, "manager", default);
                database.AllowanceRevisions.Add(new AllowanceRevision
                {
                    AccountId = overflowId, PreviousRevisionId = "", ActorId = "manager", Enabled = true,
                    AmountMinorUnits = 1, EffectiveMonth = 202704, OccurredAtUtc = clock.Now
                });
                await database.SaveChangesAsync();
            }

            await ScanAsync();
            await ScanAsync();

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var failure = await database.AllowanceExecutions.SingleAsync(execution => execution.AccountId != accountId);
                Require(failure.ErrorCode == "balance_overflow" && failure.CreditedAtUtc is null && failure.Attempts == 2 &&
                    !await database.LedgerEntries.AnyAsync(entry => entry.AccountId == failure.AccountId && entry.Source == LedgerEntrySource.Allowance),
                    "Overflow was not isolated, retryable, and financially atomic.");
            }

            Console.WriteLine("allowance_execution_passed");
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