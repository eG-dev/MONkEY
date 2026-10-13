using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

namespace RuntimeChecks.Tests;

internal static class LedgerPersistenceCheck
{
    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"ledger-persistence-{Guid.NewGuid():N}.db");
        var settings = new InstanceSettings { DataPath = Path.GetDirectoryName(path)!, Timezone = "UTC", DefaultLocale = "de-DE" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True")
            .Options;

        try
        {
            await using (var database = new PocketMonkeyDbContext(options))
            {
                var previous = database.Database.GetMigrations().Single(migration => migration.EndsWith("_SharedAccounts"));
                await database.GetService<IMigrator>().MigrateAsync(previous);
                await database.Database.ExecuteSqlRawAsync("INSERT INTO Accounts (Id, Name, NormalizedName) VALUES ('existing', 'Existing', 'EXISTING')");
                var openingSchema = database.Database.GetMigrations().Single(migration => migration.EndsWith("_OpeningLedger"));
                await database.GetService<IMigrator>().MigrateAsync(openingSchema);
                await database.Database.ExecuteSqlRawAsync("INSERT INTO Accounts (Id, Name, NormalizedName, BalanceMinorUnits) VALUES ('prior-opening', 'Prior', 'PRIOR', 1234)");
                await database.Database.ExecuteSqlRawAsync("INSERT INTO LedgerEntries (Id, AccountId, AmountMinorUnits, IdempotencyKey, ActorId, ActorDisplayName, OccurredAtUtc, Source, Comment) VALUES ('prior-entry', 'prior-opening', 1234, '00000000-0000-0000-0000-000000000001', 'prior-manager', 'Prior Manager', '2026-01-01 00:00:00+00:00', 'opening', 'Prior comment')");
                await database.Database.MigrateAsync();

                var prior = await database.LedgerEntries.SingleAsync();

                if ((await database.Accounts.FindAsync("existing"))!.BalanceMinorUnits is not null ||
                    prior.SequenceNumber != 1 || prior.AmountMinorUnits != 1234 || prior.ActorId != "prior-manager" || prior.Comment != "Prior comment" ||
                    (await database.Accounts.FindAsync("prior-opening"))!.BalanceMinorUnits != 1234)
                {
                    throw new InvalidOperationException("Migration changed an existing balance or opening provenance.");
                }

                database.Users.Add(new ApplicationUser { Id = "probe-manager", UserName = "probe", DisplayName = "Historical Manager" });
                database.Accounts.Add(new Account { Id = "maximum", Name = "Maximum", NormalizedName = "MAXIMUM" });
                database.Accounts.Add(new Account { Id = "minimum", Name = "Minimum", NormalizedName = "MINIMUM" });
                database.Accounts.Add(new Account { Id = "rollback", Name = "Rollback", NormalizedName = "ROLLBACK" });
                await database.SaveChangesAsync();
            }

            if (!CurrencyAmount.TryParse("0.10", out var first) || !CurrencyAmount.TryParse("0.20", out var second) ||
                CurrencyAmount.Format(checked(first + second)) != "0.30" ||
                !CurrencyAmount.TryParse("92233720368547758.07", out var maximum) || maximum != long.MaxValue ||
                CurrencyAmount.TryParse("92233720368547758.08", out _) || CurrencyAmount.TryParse("1.001", out _) ||
                !CurrencyAmount.TryParse("-0.01", out var negative) || negative != -1 || CurrencyAmount.Format(negative) != "-0.01" ||
                !CurrencyAmount.TryParse("-92233720368547758.08", out var minimum) || minimum != long.MinValue ||
                CurrencyAmount.Format(minimum) != "-92233720368547758.08" || CurrencyAmount.TryParse("-92233720368547758.09", out _) ||
                CurrencyAmount.TryParse("1e2", out _))
            {
                throw new InvalidOperationException("Exact monetary parsing, arithmetic, or range validation failed.");
            }

            var opening = new OpeningBalanceRequest { Amount = "0.00", IdempotencyKey = Guid.NewGuid().ToString() };

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var administration = new LedgerAdministration(database, settings);
                var posted = await administration.PostOpeningAsync("existing", opening, "probe-manager", default);
                var repeated = await administration.PostOpeningAsync("existing", opening, "probe-manager", default);
                var limit = await administration.PostOpeningAsync("maximum", new OpeningBalanceRequest
                {
                    Amount = "92233720368547758.07",
                    IdempotencyKey = Guid.NewGuid().ToString()
                }, "probe-manager", default);
                var lowerLimit = await administration.PostOpeningAsync("minimum", new OpeningBalanceRequest
                {
                    Amount = "-92233720368547758.08",
                    IdempotencyKey = Guid.NewGuid().ToString()
                }, "probe-manager", default);

                if (posted.Error is not null || repeated.Entry?.Id != posted.Entry?.Id || repeated.Error is not null ||
                    limit.Entry?.Amount != "92233720368547758.07" || lowerLimit.Entry?.Amount != "-92233720368547758.08" ||
                    posted.Entry?.ActorDisplayName != "Historical Manager")
                {
                    throw new InvalidOperationException("Zero/maximum posting or idempotent replay failed.");
                }
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER probe_fail_opening BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'opening_posted' BEGIN SELECT RAISE(ABORT, 'probe'); END;");
                var failed = false;

                try
                {
                    await new LedgerAdministration(database, settings).PostOpeningAsync("rollback", new OpeningBalanceRequest
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

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var openingEntries = await database.LedgerEntries
                    .Where(entry => entry.Source == LedgerEntrySource.Opening)
                    .ToListAsync();

                if (await database.LedgerEntries.CountAsync() != 4 || openingEntries.Count != 4 ||
                    openingEntries.Any(entry => entry.Source != LedgerEntrySource.Opening) || await database.AuditEvents.CountAsync() != 3 ||
                    (await database.Accounts.FindAsync("rollback"))!.BalanceMinorUnits is not null ||
                    (await database.Accounts.FindAsync("minimum"))!.BalanceMinorUnits != long.MinValue ||
                    (await database.Accounts.FindAsync("maximum"))!.BalanceMinorUnits != long.MaxValue)
                {
                    throw new InvalidOperationException("Posting failure left partial ledger, balance, or audit changes.");
                }

                await database.Database.ExecuteSqlRawAsync("DROP TRIGGER probe_fail_opening");
                database.LedgerEntries.Add(new LedgerEntry
                {
                    AccountId = "rollback",
                    AmountMinorUnits = -1,
                    SequenceNumber = 5,
                    Source = LedgerEntrySource.Deposit,
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
                    throw new InvalidOperationException("The database accepted a deposit with the wrong sign.");
                }
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var administration = new LedgerAdministration(database, settings);
                var openingResult = await administration.PostOpeningAsync("rollback", new OpeningBalanceRequest
                {
                    Amount = "-0.01",
                    IdempotencyKey = Guid.NewGuid().ToString()
                }, "probe-manager", default);
                var withdrawal = new TransactionRequest
                {
                    Amount = "0.02",
                    Source = LedgerEntrySource.Withdrawal,
                    IdempotencyKey = Guid.NewGuid().ToString()
                };
                var withdrawn = await administration.PostTransactionAsync("rollback", withdrawal, "probe-manager", default);
                var replay = await administration.PostTransactionAsync("rollback", withdrawal, "probe-manager", default);
                var deposit = await administration.PostTransactionAsync("rollback", new TransactionRequest
                {
                    Amount = "0.03",
                    Source = LedgerEntrySource.Deposit,
                    IdempotencyKey = Guid.NewGuid().ToString()
                }, "probe-manager", default);

                foreach (var boundary in new[] { (Account: "maximum", Source: LedgerEntrySource.Deposit), (Account: "minimum", Source: LedgerEntrySource.Withdrawal) })
                {
                    var overflow = await administration.PostTransactionAsync(boundary.Account, new TransactionRequest
                    {
                        Amount = "0.01",
                        Source = boundary.Source,
                        IdempotencyKey = Guid.NewGuid().ToString()
                    }, "probe-manager", default);

                    if (overflow.Error != LedgerError.BalanceOverflow)
                    {
                        throw new InvalidOperationException("Overflow was not rejected at a signed balance boundary.");
                    }
                }

                if (openingResult.Entry?.Amount != "-0.01" || withdrawn.Entry?.Amount != "-0.02" || replay.Entry?.Id != withdrawn.Entry?.Id ||
                    deposit.Error is not null || (await database.Accounts.FindAsync("rollback"))!.BalanceMinorUnits != 0)
                {
                    throw new InvalidOperationException("Signed opening, overdraft, deposit, or replay failed.");
                }

                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER probe_fail_transaction BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'transaction_posted' BEGIN SELECT RAISE(ABORT, 'probe'); END;");
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var failed = false;

                try
                {
                    await new LedgerAdministration(database, settings).PostTransactionAsync("rollback", new TransactionRequest
                    {
                        Amount = "1.00",
                        Source = LedgerEntrySource.Deposit,
                        IdempotencyKey = Guid.NewGuid().ToString()
                    }, "probe-manager", default);
                }
                catch (DbUpdateException)
                {
                    failed = true;
                }

                if (!failed)
                {
                    throw new InvalidOperationException("Transaction audit failure did not reject the post.");
                }
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var sequences = await database.LedgerEntries.OrderBy(entry => entry.SequenceNumber).Select(entry => entry.SequenceNumber).ToListAsync();

                if (!sequences.SequenceEqual(Enumerable.Range(1, 7).Select(sequence => (long)sequence)) ||
                    await database.AuditEvents.CountAsync() != 6 || (await database.Accounts.FindAsync("rollback"))!.BalanceMinorUnits != 0)
                {
                    throw new InvalidOperationException("Failed posting left partial balance, ledger, sequence, or audit changes.");
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