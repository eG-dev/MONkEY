using System.Data.Common;
using System.Globalization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Logging.Abstractions;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

namespace RuntimeChecks.Tests;

internal static class LedgerPersistenceCheck
{
    public static async Task ConfigureRetentionFixtureAsync(string path, string accountId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        ArgumentException.ThrowIfNullOrWhiteSpace(accountId);

        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True").Options;
        await using var database = new PocketMonkeyDbContext(options);

        if (!await database.Accounts.AnyAsync(account => account.Id == accountId))
        {
            throw new InvalidOperationException("Retention fixture account is missing.");
        }

        var old = DateTimeOffset.UtcNow.AddMonths(-25);
        await database.LedgerEntries.Where(entry => entry.AccountId == accountId && entry.Source != LedgerEntrySource.Opening)
            .ExecuteUpdateAsync(update => update.SetProperty(entry => entry.OccurredAtUtc, old));

        Console.WriteLine("retention_fixture_ready");
    }

    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"ledger-persistence-{Guid.NewGuid():N}.db");
        var settings = new InstanceSettings { DataPath = Path.GetDirectoryName(path)!, Timezone = "UTC", DefaultLocale = "de-DE" };
        var queryCapture = new RetentionQueryCapture();
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True")
            .AddInterceptors(queryCapture)
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

            await CheckRetentionAsync(options, settings);
            await CheckRetentionQueryPlanAsync(options, queryCapture);
            await CheckUtcMappingAsync();

            Console.WriteLine("ledger_persistence_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(path);
        }
    }

    private static async Task CheckUtcMappingAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"ledger-utc-mapping-{Guid.NewGuid():N}.db");
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True")
            .Options;
        var stored = new[]
        {
            "2024-10-01 00:00:00+00:00",
            "2024-09-30T23:59:59.9999999Z",
            "2024-10-01T00:00:00.0000001+00:00",
            "2024-10-01 00:00:00.0000000Z",
            "2024-02-29 12:34:56.1234567+00:00",
            "2000-02-29T00:00:00.1200000Z",
            "1900-02-28 00:00:00.0000000+00:00",
            "0001-01-01 00:00:00Z",
            "9999-12-31T23:59:59.9999999+00:00"
        };

        try
        {
            await using var database = new PocketMonkeyDbContext(options);
            var previous = database.Database.GetMigrations().Single(migration => migration.EndsWith("_TransactionRetention"));
            var mapping = database.Database.GetMigrations().Single(migration => migration.EndsWith("_LedgerUtcDateTimeMapping"));
            await database.GetService<IMigrator>().MigrateAsync(previous);
            await database.Database.ExecuteSqlRawAsync("INSERT INTO Accounts (Id, Name, NormalizedName, BalanceMinorUnits) VALUES ('mapping', 'Mapping', 'MAPPING', -123)");

            for (var index = 0; index < stored.Length; index++)
            {
                var source = index == 0 ? "opening" : "deposit";
                var amount = index == 0 ? -131 : 1;
                await database.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO LedgerEntries (Id, AccountId, AmountMinorUnits, SequenceNumber, IdempotencyKey,
                        ActorId, ActorDisplayName, OccurredAtUtc, Source, Comment)
                    VALUES ({$"mapping-{index}"}, 'mapping', {amount}, {index + 1}, {Guid.NewGuid().ToString()},
                        'original-actor', 'Original Actor', {stored[index]}, {source}, 'Original comment')
                    """);
            }

            await database.Database.ExecuteSqlRawAsync("""
                INSERT INTO LedgerEntries (Id, AccountId, AmountMinorUnits, SequenceNumber, IdempotencyKey,
                    ActorId, ActorDisplayName, OccurredAtUtc, Source)
                VALUES ('invalid', 'mapping', 1, 10, '00000000-0000-0000-0000-000000000010',
                    'original-actor', 'Original Actor', 'invalid', 'deposit');
                """);

            foreach (var invalid in new[]
            {
                "invalid", "2024-10-01 00:00:00+01:00", "2024-10-01 00:00:00",
                "2023-02-29 00:00:00+00:00", "1900-02-29 00:00:00Z", "2024-04-31T00:00:00Z",
                "0000-01-01 00:00:00Z", "2024-13-01 00:00:00Z", "2024-01-00 00:00:00Z",
                "2024-10-01T24:00:00Z", "2024-10-01 00:60:00Z", "2024-10-01 00:00:60Z",
                "2024-10-01 00:00:00.12345678Z", "2024-10-01 00:00:00.Z", "2024-10-01 00:00:00.xZ"
            })
            {
                await database.Database.ExecuteSqlInterpolatedAsync($"UPDATE LedgerEntries SET OccurredAtUtc = {invalid} WHERE Id = 'invalid'");
                var rejected = false;

                try
                {
                    await database.Database.MigrateAsync();
                }
                catch (SqliteException exception) when (exception.SqliteExtendedErrorCode == 275 &&
                    exception.Message.Contains("unsupported UTC timestamp", StringComparison.Ordinal))
                {
                    rejected = true;
                }

                var unchanged = await database.Database.SqlQueryRaw<string>(
                    "SELECT OccurredAtUtc AS Value FROM LedgerEntries WHERE Id <> 'invalid' ORDER BY SequenceNumber").ToListAsync();

                if (!rejected || !unchanged.SequenceEqual(stored) || (await database.Database.GetAppliedMigrationsAsync()).Contains(mapping))
                {
                    throw new InvalidOperationException("Unsupported ledger timestamps did not abort the upgrade atomically.");
                }
            }

            await database.Database.ExecuteSqlRawAsync("DELETE FROM LedgerEntries WHERE Id = 'invalid'");
            await database.Database.MigrateAsync();
            var entries = await database.LedgerEntries.AsNoTracking().OrderBy(entry => entry.SequenceNumber).ToListAsync();

            for (var index = 0; index < stored.Length; index++)
            {
                var entry = entries[index];
                var expected = DateTimeOffset.Parse(stored[index], CultureInfo.InvariantCulture);

                if (entry.OccurredAtUtc != expected || entry.OccurredAtUtc.Offset != TimeSpan.Zero ||
                    entry.ActorId != "original-actor" || entry.ActorDisplayName != "Original Actor" ||
                    entry.Comment != "Original comment" || entry.AmountMinorUnits != (index == 0 ? -131 : 1))
                {
                    throw new InvalidOperationException("UTC mapping changed an instant, precision or ledger provenance.");
                }
            }

            var chronological = await database.LedgerEntries
                .Where(entry => entry.OccurredAtUtc < DateTimeOffset.Parse("2024-10-01T00:00:00Z"))
                .OrderBy(entry => entry.OccurredAtUtc)
                .ThenBy(entry => entry.SequenceNumber)
                .Select(entry => entry.SequenceNumber)
                .ToListAsync();

            if ((await database.Accounts.SingleAsync()).BalanceMinorUnits != -123 ||
                !chronological.SequenceEqual(new long[] { 8, 7, 6, 5, 2 }))
            {
                throw new InvalidOperationException("UTC mapping changed balances, chronological ordering or exact cutoff comparison.");
            }

            var offsetValue = DateTimeOffset.Parse("2026-10-19T12:34:56.1234567+05:45", CultureInfo.InvariantCulture);
            database.LedgerEntries.Add(new LedgerEntry
            {
                Id = "offset-roundtrip", AccountId = "mapping", AmountMinorUnits = 1, SequenceNumber = 10,
                IdempotencyKey = Guid.NewGuid().ToString(), Source = LedgerEntrySource.Deposit,
                ActorId = "original-actor", ActorDisplayName = "Original Actor", OccurredAtUtc = offsetValue
            });
            await database.SaveChangesAsync();
            database.ChangeTracker.Clear();
            var roundtrip = await database.LedgerEntries.SingleAsync(entry => entry.Id == "offset-roundtrip");

            if (roundtrip.OccurredAtUtc != offsetValue || roundtrip.OccurredAtUtc.Offset != TimeSpan.Zero)
            {
                throw new InvalidOperationException("UTC mapping did not normalize an offset without losing precision.");
            }

            await database.GetService<IMigrator>().MigrateAsync(previous);
            var reversed = await database.Database.SqlQueryRaw<string>(
                "SELECT OccurredAtUtc AS Value FROM LedgerEntries ORDER BY SequenceNumber").ToListAsync();

            if (!reversed.All(value => value.EndsWith("+00:00", StringComparison.Ordinal)) ||
                !reversed.Take(stored.Length).Select(value => DateTimeOffset.Parse(value, CultureInfo.InvariantCulture))
                    .SequenceEqual(entries.Select(entry => entry.OccurredAtUtc)) ||
                DateTimeOffset.Parse(reversed[^1], CultureInfo.InvariantCulture) != offsetValue)
            {
                throw new InvalidOperationException("Reverse UTC representation conversion changed an instant or precision.");
            }

            await database.Database.MigrateAsync();
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            File.Delete(path);
        }
    }

    private static async Task CheckRetentionQueryPlanAsync(DbContextOptions<PocketMonkeyDbContext> options, RetentionQueryCapture capture)
    {
        if (capture.CommandText is null || !capture.Parameters.Any(parameter => parameter.Value is int limit && limit == 200))
        {
            throw new InvalidOperationException("Retention did not execute a database-side bounded candidate query.");
        }

        await using var database = new PocketMonkeyDbContext(options);
        await database.Database.OpenConnectionAsync();
        await using var command = database.Database.GetDbConnection().CreateCommand();
        command.CommandText = "EXPLAIN QUERY PLAN " + capture.CommandText;

        foreach (var parameter in capture.Parameters)
        {
            var copy = command.CreateParameter();
            copy.ParameterName = parameter.Name;
            copy.Value = parameter.Value;
            command.Parameters.Add(copy);
        }

        await using var reader = await command.ExecuteReaderAsync();
        var indexed = false;

        while (await reader.ReadAsync())
        {
            var detail = reader.GetString(3);
            indexed |= detail.Contains("IX_LedgerEntries_OccurredAtUtc_SequenceNumber", StringComparison.Ordinal);

            if (detail.Contains("TEMP B-TREE", StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Retention ordering did not use the timestamp/sequence index.");
            }
        }

        if (!indexed)
        {
            throw new InvalidOperationException("Retention did not use the timestamp/sequence index.");
        }
    }

    private static async Task CheckRetentionAsync(DbContextOptions<PocketMonkeyDbContext> options, InstanceSettings settings)
    {
        var clock = new RetentionClock { Now = DateTimeOffset.Parse("2026-10-19T12:00:00Z") };
        var cutoff = DateTimeOffset.Parse("2024-10-01T00:00:00Z");
        var old = new TransactionRequest
        {
            Amount = "0.01", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
        };
        string cursor;
        long highWater;
        long? balance;
        int initialCount;

        var application = new Microsoft.Extensions.Hosting.HostApplicationBuilder(
            new Microsoft.Extensions.Hosting.HostApplicationBuilderSettings { EnvironmentName = "Development", DisableDefaults = true });

        foreach (var invalid in new[] { "-1", "121", "2147483647", "bad", "1.5", "2147483648", "", " 24", "+24" })
        {
            application.Configuration["MONKEY_TRANSACTION_RETENTION_MONTHS"] = invalid;
            var rejected = false;

            try
            {
                InstanceSettings.Read(application.Configuration, application.Environment);
            }
            catch (InvalidOperationException)
            {
                rejected = true;
            }

            if (!rejected)
            {
                throw new InvalidOperationException("Invalid retention duration was accepted.");
            }
        }

        foreach (var duration in new[] { 0, 1, 24, 119, 120 })
        {
            application.Configuration["MONKEY_TRANSACTION_RETENTION_MONTHS"] = duration.ToString(System.Globalization.CultureInfo.InvariantCulture);

            if (InstanceSettings.Read(application.Configuration, application.Environment).TransactionRetentionMonths != duration)
            {
                throw new InvalidOperationException("Valid retention duration was rejected.");
            }
        }

        application.Configuration["MONKEY_TRANSACTION_RETENTION_MONTHS"] = null;

        if (InstanceSettings.Read(application.Configuration, application.Environment).TransactionRetentionMonths != 24)
        {
            throw new InvalidOperationException("Default retention duration is not 24 months.");
        }

        if (TransactionRetention.Cutoff(clock.Now, 24) != cutoff || TransactionRetention.Cutoff(clock.Now, 0) is not null ||
            TransactionRetention.Cutoff(clock.Now, 120) != DateTimeOffset.Parse("2016-10-01T00:00:00Z") ||
            TransactionRetention.Cutoff(DateTimeOffset.Parse("0005-01-01T00:00:00Z"), 120) != DateTimeOffset.MinValue ||
            TransactionRetention.Cutoff(DateTimeOffset.Parse("2026-01-01T00:00:00Z"), 1) != DateTimeOffset.Parse("2025-12-01T00:00:00Z"))
        {
            throw new InvalidOperationException("UTC retention cutoff, unlimited duration or clamping failed.");
        }

        await using (var database = new PocketMonkeyDbContext(options))
        {
            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER probe_fail_transaction;");
            var administration = new LedgerAdministration(database, settings, clock);
            clock.Now = cutoff;
            await administration.PostTransactionAsync("rollback", old with { IdempotencyKey = Guid.NewGuid().ToString() }, "probe-manager", default);
            clock.Now = cutoff.AddTicks(-1);
            await administration.PostTransactionAsync("rollback", old, "probe-manager", default);

            for (var index = 0; index < 200; index++)
            {
                await administration.PostTransactionAsync("rollback", old with { IdempotencyKey = Guid.NewGuid().ToString() }, "probe-manager", default);
            }

            clock.Now = DateTimeOffset.Parse("2026-10-19T12:00:00Z");
            var history = await administration.HistoryAsync("rollback", 1, null, default);
            cursor = history.History!.NextCursor!;
            highWater = (await database.LedgerMaintenanceStates.SingleAsync()).LastAllocatedSequenceNumber;
            balance = (await database.Accounts.FindAsync("rollback"))!.BalanceMinorUnits;
            initialCount = await database.LedgerEntries.CountAsync();

            if (history.History.RetentionMonths != 24 || history.History.RetentionCutoffUtc != cutoff)
            {
                throw new InvalidOperationException("History retention metadata is incorrect.");
            }

            await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER FailRetentionAudit BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'transaction_history_pruned' BEGIN SELECT RAISE(ABORT, 'retention probe'); END;");
        }

        async Task<int> CleanupAsync(InstanceSettings selected)
        {
            await using var database = new PocketMonkeyDbContext(options);
            return await new TransactionRetention(database, selected, clock, NullLogger<TransactionRetention>.Instance).RunAsync(default);
        }

        if (await CleanupAsync(settings with { TransactionRetentionMonths = 0 }) != 0)
        {
            throw new InvalidOperationException("Unlimited retention deleted history.");
        }

        var failed = false;

        try
        {
            await CleanupAsync(settings);
        }
        catch (DbUpdateException)
        {
            failed = true;
        }

        await using (var database = new PocketMonkeyDbContext(options))
        {
            if (!failed || await database.LedgerEntries.CountAsync() != initialCount || await database.RetiredLedgerKeys.AnyAsync() ||
                (await database.LedgerMaintenanceStates.SingleAsync()).RetentionRevision != 0)
            {
                throw new InvalidOperationException("Failed cleanup left partial retired keys, deletion or revision changes.");
            }

            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER FailRetentionAudit;");
            await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER FailSecondRetentionBatch BEFORE INSERT ON AuditEvents WHEN NEW.Action = 'transaction_history_pruned' AND (SELECT RetentionRevision FROM LedgerMaintenanceStates) >= 1 BEGIN SELECT RAISE(ABORT, 'second batch'); END;");
        }

        failed = false;

        try
        {
            await CleanupAsync(settings with { Timezone = "Pacific/Auckland" });
        }
        catch (DbUpdateException)
        {
            failed = true;
        }

        await using (var database = new PocketMonkeyDbContext(options))
        {
            if (!failed || await database.RetiredLedgerKeys.CountAsync() != 200 ||
                (await database.LedgerMaintenanceStates.SingleAsync()).RetentionRevision != 1 ||
                await database.LedgerEntries.CountAsync() != initialCount - 200)
            {
                throw new InvalidOperationException("Interrupted cleanup lost a committed batch or partially committed the failed batch.");
            }

            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER FailSecondRetentionBatch;");
        }

        if (await CleanupAsync(settings) != 1 || await CleanupAsync(settings) != 0)
        {
            throw new InvalidOperationException("Cleanup batching, restart, exact tick boundary or TZ independence failed.");
        }

        await using (var database = new PocketMonkeyDbContext(options))
        {
            var administration = new LedgerAdministration(database, settings, clock);
            var expired = await administration.PostTransactionAsync("rollback", old, "probe-manager", default);
            var changed = await administration.HistoryAsync("rollback", 1, cursor, default);
            var legacyCursor = Convert.ToBase64String(System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(new
            {
                AccountId = "rollback", Snapshot = highWater, Before = highWater
            }));
            var legacy = await administration.HistoryAsync("rollback", 1, legacyCursor, default);
            var state = await database.LedgerMaintenanceStates.AsNoTracking().SingleAsync();

            if (expired.Error != LedgerError.TransactionHistoryExpired || changed.Error != LedgerError.HistoryRetentionChanged ||
                legacy.Error != LedgerError.HistoryRetentionChanged ||
                state.LastAllocatedSequenceNumber != highWater || state.RetentionRevision != 2 ||
                await database.RetiredLedgerKeys.CountAsync() != 201 ||
                await database.LedgerEntries.CountAsync() != initialCount - 201 ||
                (await database.Accounts.FindAsync("rollback"))!.BalanceMinorUnits != balance ||
                !await database.LedgerEntries.AnyAsync(entry => entry.Source == LedgerEntrySource.Opening && entry.AmountMinorUnits < 0))
            {
                throw new InvalidOperationException("Cleanup changed balances/openings, reused keys or failed to invalidate history.");
            }

            var posted = await administration.PostTransactionAsync("rollback", old with { IdempotencyKey = Guid.NewGuid().ToString() }, "probe-manager", default);
            var last = await database.LedgerEntries.SingleAsync(entry => entry.Id == posted.Entry!.Id);

            if (last.SequenceNumber != highWater + 1)
            {
                throw new InvalidOperationException("Pruning allowed a posting sequence to be reused.");
            }

            var unlimited = await new LedgerAdministration(database, settings with { TransactionRetentionMonths = 0 }, clock)
                .HistoryAsync("rollback", 1, null, default);

            if (unlimited.History!.RetentionCutoffUtc is not null || unlimited.History.RetentionMonths != 0)
            {
                throw new InvalidOperationException("Unlimited history metadata is incorrect.");
            }
        }

        await Task.WhenAll(Task.Run(() => CleanupAsync(settings)), Task.Run(async () =>
        {
            await using var database = new PocketMonkeyDbContext(options);
            var administration = new LedgerAdministration(database, settings, clock);
            var firstPage = await administration.HistoryAsync("rollback", 1, null, default);
            var posted = await administration.PostTransactionAsync("rollback", old with { IdempotencyKey = Guid.NewGuid().ToString() }, "probe-manager", default);
            var next = await administration.HistoryAsync("rollback", 1, firstPage.History!.NextCursor, default);

            if (posted.Error is not null || next.Error is not null || next.History!.Entries.Any(entry => entry.Id == posted.Entry!.Id))
            {
                throw new InvalidOperationException("Concurrent cleanup/posting broke normal snapshot pagination.");
            }
        }));

    }

    private sealed class RetentionQueryCapture : DbCommandInterceptor
    {
        public string? CommandText { get; private set; }
        public List<(string Name, object Value)> Parameters { get; private set; } = [];

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(DbCommand command,
            CommandEventData eventData, InterceptionResult<DbDataReader> result, CancellationToken cancellationToken = default)
        {
            if (command.CommandText.Contains("FROM \"LedgerEntries\"", StringComparison.Ordinal) &&
                command.CommandText.Contains("ORDER BY", StringComparison.Ordinal) &&
                command.CommandText.Contains("EXISTS", StringComparison.Ordinal) &&
                command.CommandText.Contains("LIMIT", StringComparison.Ordinal))
            {
                CommandText = command.CommandText;
                Parameters = command.Parameters.Cast<DbParameter>().Select(parameter => (parameter.ParameterName, parameter.Value!)).ToList();
            }

            return ValueTask.FromResult(result);
        }
    }

    private sealed class RetentionClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; }

        public override DateTimeOffset GetUtcNow() => Now;
    }
}