using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using System.Text.Json.Nodes;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Recovery;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Host.Operations;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;
using PocketMonkey.Storage.Entities;

namespace RuntimeChecks.Tests;

internal static class FinancialRecoveryCheck
{
    public static async Task RunAsync(string? fixtureDirectory = null)
    {
        var root = Path.Combine(Path.GetTempPath(), $"financial-recovery-{Guid.NewGuid():N}");
        Directory.CreateDirectory(root);
        var settings = new InstanceSettings { DataPath = root, Timezone = "UTC", DefaultLocale = "en-US" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite(settings.ConnectionString).Options;
        var snapshot = EmptySnapshot();

        try
        {
            await using var database = new PocketMonkeyDbContext(options);
            await database.Database.MigrateAsync();
            var service = new FinancialSnapshotService(database, settings, TimeProvider.System);
            await service.ImportAsync(snapshot, default);
            var captured = await service.CaptureAsync(default);
            Require(captured.Accounts.Single().Name == "Uninitialized" && captured.Accounts.Single().Balance is null);
            Require(captured.LedgerEntries.Length == 0 && captured.AuditEvents.Single().Action == "financial_snapshot_imported");

            try
            {
                await service.ImportAsync(snapshot, default);
                throw new InvalidOperationException("Nonempty recovery was accepted.");
            }
            catch (InvalidDataException failure) when (failure.Message == "recovery_target_not_empty")
            {
            }

            Require(await database.Accounts.CountAsync() == 1);
            Require(FinancialSnapshotJson.ParseMoney(FinancialSnapshotJson.Money(long.MinValue)) == long.MinValue);
            Require(FinancialSnapshotJson.ParseMoney(FinancialSnapshotJson.Money(long.MaxValue)) == long.MaxValue);
            var exports = Path.Combine(root, "exports");
            var store = new FinancialExportStore(exports, 1);
            store.Prepare();
            var now = new DateTimeOffset(2026, 10, 25, 2, 0, 0, TimeSpan.Zero);
            var calls = 0;

            Task<FinancialSnapshot> Capture(CancellationToken cancellationToken)
            {
                calls++;
                return Task.FromResult(snapshot with { CapturedAtUtc = now, SnapshotId = Guid.NewGuid().ToString() });
            }

            Require(await store.CheckAsync(Capture, now, "UTC", default));
            Require(!await store.CheckAsync(Capture, now.AddMinutes(1), "UTC", default) && calls == 1);
            Require(!await new FinancialExportStore(exports, 1).CheckAsync(Capture, now.AddDays(1), "UTC", default));
            Require(Directory.GetFiles(exports, "pocket-monkey-*.json").Length == 1);
            Require(FinancialExportStore.DueSlot(now, "Europe/Berlin") == new DateTimeOffset(2026, 10, 24, 23, 0, 0, TimeSpan.Zero));
            await CheckScenariosAsync(root, fixtureDirectory);
            await CheckFailuresAsync(root);
            await CheckStoreAsync(root);
            await CheckFileFailuresAsync(root);
            await CheckConcurrentCaptureAsync(root);
            Console.WriteLine("financial_recovery_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            Directory.Delete(root, true);
        }
    }

    private static async Task CheckFailuresAsync(string root)
    {
        var source = FinancialScenarioFixtures.All()["signed-balances"];
        var invalid = new[]
        {
            source with { FormatVersion = 2 },
            source with { Accounts = [source.Accounts[0] with { Balance = "12.51" }, .. source.Accounts.Skip(1)] },
            source with { LedgerEntries = [source.LedgerEntries[0] with { Amount = "10.001" }, .. source.LedgerEntries.Skip(1)] },
            source with { LedgerEntries = [source.LedgerEntries[0] with { AccountId = Guid.NewGuid().ToString() }, .. source.LedgerEntries.Skip(1)] },
            source with { RetiredLedgerKeys = [new SnapshotRetiredLedgerKey
            {
                IdempotencyKey = source.LedgerEntries[0].IdempotencyKey, RetiredAtUtc = source.CapturedAtUtc
            }] },
            source with { LedgerMaintenanceState = source.LedgerMaintenanceState with { LastAllocatedSequenceNumber = 0 } }
        };

        foreach (var snapshot in invalid)
        {
            try
            {
                FinancialSnapshotValidation.Validate(snapshot);
                throw new InvalidOperationException("Malformed snapshot accepted.");
            }
            catch (InvalidDataException)
            {
            }
        }

        var jsonPath = Path.Combine(root, "invalid.json");
        var node = JsonSerializer.SerializeToNode(source, FinancialSnapshotJson.Options)!.AsObject();
        node["unknown"] = true;
        await File.WriteAllTextAsync(jsonPath, node.ToJsonString());

        try
        {
            await FinancialSnapshotJson.ReadAsync(jsonPath, default);
            throw new InvalidOperationException("Unknown snapshot property accepted.");
        }
        catch (JsonException)
        {
        }

        var validJson = JsonSerializer.Serialize(source, FinancialSnapshotJson.Options);
        var numericSequence = JsonSerializer.SerializeToNode(source, FinancialSnapshotJson.Options)!;
        numericSequence["ledgerEntries"]![0]!["sequenceNumber"] = 1;

        foreach (var invalidJson in new[]
        {
            validJson.Insert(1, "\"formatVersion\":1,"),
            numericSequence.ToJsonString(),
            validJson.Replace("2026-06-15T12:00:00.0000000Z", "2026-06-15T12:00:00+02:00", StringComparison.Ordinal)
        })
        {
            await File.WriteAllTextAsync(jsonPath, invalidJson);

            try
            {
                await FinancialSnapshotJson.ReadAsync(jsonPath, default);
                throw new InvalidOperationException("Noncanonical snapshot JSON accepted.");
            }
            catch (JsonException)
            {
            }
        }

        await using (var oversized = new FileStream(jsonPath, FileMode.Create))
        {
            oversized.SetLength(FinancialSnapshotJson.MaximumFileBytes + 1);
        }

        try
        {
            await FinancialSnapshotJson.ReadAsync(jsonPath, default);
            throw new InvalidOperationException("Oversized snapshot accepted.");
        }
        catch (InvalidDataException)
        {
        }

        var target = Path.Combine(root, "rollback");
        Directory.CreateDirectory(target);
        var settings = new InstanceSettings { DataPath = target, Timezone = "UTC", DefaultLocale = "en-US" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite(settings.ConnectionString).Options;

        await using (var database = new PocketMonkeyDbContext(options))
        {
            await database.Database.MigrateAsync();
            await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER RejectRecovery BEFORE INSERT ON LedgerEntries BEGIN SELECT RAISE(ABORT, 'fixture failure'); END;");

            try
            {
                await new FinancialSnapshotService(database, settings, TimeProvider.System).ImportAsync(source, default);
                throw new InvalidOperationException("Rollback fixture did not fail.");
            }
            catch (DbUpdateException)
            {
            }
        }

        await using (var database = new PocketMonkeyDbContext(options))
        {
            Require(!await database.Accounts.AnyAsync() && !await database.LedgerEntries.AnyAsync()
                && !await database.AuditEvents.AnyAsync());
            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER RejectRecovery;");
        }

        await File.WriteAllBytesAsync(jsonPath, JsonSerializer.SerializeToUtf8Bytes(source, FinancialSnapshotJson.Options));
        Require(await FinancialImportCommand.RunAsync(settings with { Currency = "USD" }, jsonPath, default) == 1);
        await using var locked = new SqliteConnection(settings.ConnectionString);
        await locked.OpenAsync();
        await using var transaction = locked.BeginTransaction();
        Require(await FinancialImportCommand.RunAsync(settings, jsonPath, default) == 1);
    }

    private static async Task CheckStoreAsync(string root)
    {
        var source = FinancialScenarioFixtures.All()["signed-balances"];
        var changed = source with
        {
            Accounts = source.Accounts.Select(account => account with
            {
                Name = account.Name + " renamed",
                NormalizedName = account.NormalizedName + " RENAMED"
            }).ToArray()
        };
        Require(FinancialExportStore.ContentHash(source) == FinancialExportStore.ContentHash(source with
        {
            SnapshotId = Guid.NewGuid().ToString(),
            CapturedAtUtc = DateTimeOffset.UtcNow,
            ApplicationVersion = "changed",
            LedgerMaintenanceState = source.LedgerMaintenanceState with { LastCompletedAtUtc = DateTimeOffset.UtcNow },
            Accounts = source.Accounts.Reverse().ToArray(),
            LedgerEntries = source.LedgerEntries.Reverse().ToArray()
        }));
        Require(FinancialExportStore.ContentHash(source) != FinancialExportStore.ContentHash(changed));

        foreach (var keepCount in new[] { 0, 1, 2, 365 })
        {
            var path = Path.Combine(root, $"store-{keepCount}");
            var store = new FinancialExportStore(path, keepCount);
            store.Prepare();
            var unrelated = Path.Combine(path, "leave-me.json");
            await File.WriteAllTextAsync(unrelated, "untouched");

            for (var day = 0; day < 3; day++)
            {
                var now = FinancialScenarioFixtures.ReferenceTime.AddDays(day);
                var selected = (day % 2 == 0 ? source : changed) with { CapturedAtUtc = now, SnapshotId = Guid.NewGuid().ToString() };
                Require(await store.CheckAsync(_ => Task.FromResult(selected), now, "UTC", default));
            }

            Require(Directory.GetFiles(path, "pocket-monkey-*.json").Length == (keepCount == 0 ? 3 : Math.Min(3, keepCount)));
            Require(await File.ReadAllTextAsync(unrelated) == "untouched");
            File.Delete(Path.Combine(path, ".export-state.json"));
            var later = FinancialScenarioFixtures.ReferenceTime.AddDays(4);
            Require(!await store.CheckAsync(_ => Task.FromResult(source with { CapturedAtUtc = later }), later, "UTC", default));
            var baseline = Directory.GetFiles(path, "pocket-monkey-*.json").OrderDescending(StringComparer.Ordinal).First();
            await File.WriteAllTextAsync(baseline, "corrupt");

            try
            {
                await store.CheckAsync(_ => Task.FromResult(source), later.AddDays(1), "UTC", default);
                throw new InvalidOperationException("Corrupt baseline ignored.");
            }
            catch (JsonException)
            {
            }
        }

        Require(FinancialExportStore.DueSlot(new DateTimeOffset(2026, 11, 1, 6, 30, 0, TimeSpan.Zero), "America/New_York")
            == new DateTimeOffset(2026, 11, 1, 5, 0, 0, TimeSpan.Zero));
        Require(FinancialExportStore.DueSlot(new DateTimeOffset(2026, 10, 25, 1, 30, 0, TimeSpan.Zero), "Europe/London")
            == new DateTimeOffset(2026, 10, 25, 0, 0, 0, TimeSpan.Zero));
        Require(FinancialExportStore.DueSlot(new DateTimeOffset(2026, 3, 29, 1, 30, 0, TimeSpan.Zero), "Europe/London")
            == new DateTimeOffset(2026, 3, 29, 1, 0, 0, TimeSpan.Zero));
    }

    private static async Task CheckScenariosAsync(string root, string? fixtureDirectory)
    {
        foreach (var (name, generated) in FinancialScenarioFixtures.All())
        {
            var snapshot = fixtureDirectory is null ? generated
                : await FinancialSnapshotJson.ReadAsync(Path.Combine(fixtureDirectory, $"{name}.json"), default);
            FinancialSnapshotValidation.Validate(snapshot);
            var directory = Path.Combine(root, name);
            Directory.CreateDirectory(directory);
            var path = Path.Combine(directory, "snapshot.json");
            await File.WriteAllBytesAsync(path, JsonSerializer.SerializeToUtf8Bytes(snapshot, FinancialSnapshotJson.Options));
            var settings = new InstanceSettings { DataPath = directory, Timezone = "UTC", DefaultLocale = "en-US" };
            Require(await FinancialImportCommand.RunAsync(settings, path, default) == 0);
            Require(await FinancialImportCommand.RunAsync(settings, path, default) == 1);
            var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite(settings.ConnectionString).Options;
            await using var database = new PocketMonkeyDbContext(options);
            var clock = new RecoveryClock { Now = FinancialScenarioFixtures.ReferenceTime };
            var service = new FinancialSnapshotService(database, settings, clock);
            var captured = await service.CaptureAsync(default);
            Require(captured.Accounts.All(account => snapshot.Accounts.Contains(account)));
            Require(captured.LedgerEntries.OrderBy(entry => entry.SequenceNumber)
                .SequenceEqual(snapshot.LedgerEntries.OrderBy(entry => entry.SequenceNumber)));
            Require(captured.Accounts.Length == snapshot.Accounts.Length);
            Require(captured.LedgerMaintenanceState == snapshot.LedgerMaintenanceState);
            Require(captured.AllowanceRevisions.SequenceEqual(snapshot.AllowanceRevisions));
            Require(captured.AllowanceExecutions.SequenceEqual(snapshot.AllowanceExecutions));
            Require(captured.RetiredLedgerKeys.SequenceEqual(snapshot.RetiredLedgerKeys));
            Require(await database.Accounts.AllAsync(account => account.ImageKey == null));

            if (name == "allowance-recovery")
            {
                clock.Now = new DateTimeOffset(2026, 8, 15, 12, 0, 0, TimeSpan.Zero);
                var executor = new AllowanceExecutor(database, new LedgerAdministration(database, settings, clock),
                    settings, clock, NullLogger<AllowanceExecutor>.Instance);
                await executor.RunAsync(default);
                database.ChangeTracker.Clear();
                Require(await database.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 1500);
                await executor.RunAsync(default);
                Require(await database.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 1500);

                var credited = snapshot.LedgerEntries.Single(entry => entry.Source == "allowance");
                var pruned = snapshot with
                {
                    LedgerEntries = snapshot.LedgerEntries.Where(entry => entry != credited).ToArray(),
                    RetiredLedgerKeys = [new SnapshotRetiredLedgerKey
                    {
                        IdempotencyKey = credited.IdempotencyKey,
                        RetiredAtUtc = clock.Now
                    }],
                    LedgerMaintenanceState = snapshot.LedgerMaintenanceState with { RetentionRevision = 1 }
                };
                var prunedPath = Path.Combine(root, "pruned-allowance");
                Directory.CreateDirectory(prunedPath);
                var prunedSettings = settings with { DataPath = prunedPath };
                var prunedOptions = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
                    .UseSqlite(prunedSettings.ConnectionString)
                    .Options;
                await using var prunedDatabase = new PocketMonkeyDbContext(prunedOptions);
                await prunedDatabase.Database.MigrateAsync();
                await new FinancialSnapshotService(prunedDatabase, prunedSettings, clock).ImportAsync(pruned, default);
                var prunedExecutor = new AllowanceExecutor(prunedDatabase, new LedgerAdministration(prunedDatabase, prunedSettings, clock),
                    prunedSettings, clock, NullLogger<AllowanceExecutor>.Instance);
                await prunedExecutor.RunAsync(default);
                await prunedExecutor.RunAsync(default);
                Require(await prunedDatabase.Accounts.Select(account => account.BalanceMinorUnits).SingleAsync() == 1500);
            }
        }
    }

    private static async Task CheckConcurrentCaptureAsync(string root)
    {
        var path = Path.Combine(root, "concurrent");
        Directory.CreateDirectory(path);
        var settings = new InstanceSettings { DataPath = path, Timezone = "UTC", DefaultLocale = "en-US" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite(settings.ConnectionString)
            .Options;
        var source = FinancialScenarioFixtures.All()["signed-balances"];
        var accountId = source.Accounts.Single(account => account.Name == "Positive").Id;

        await using (var database = new PocketMonkeyDbContext(options))
        {
            await database.Database.MigrateAsync();
            await new FinancialSnapshotService(database, settings, TimeProvider.System).ImportAsync(source, default);
            database.Users.Add(new ApplicationUser { Id = "capture-manager", UserName = "capture", DisplayName = "Capture Manager" });
            await database.SaveChangesAsync();
        }

        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var posting = Task.Run(async () =>
        {
            await start.Task;

            for (var iteration = 0; iteration < 10; iteration++)
            {
                await using var database = new PocketMonkeyDbContext(options);
                var result = await new LedgerAdministration(database, settings,
                    new RecoveryClock { Now = new DateTimeOffset(2029, 1, 15, 12, 0, 0, TimeSpan.Zero) }).PostTransactionAsync(accountId, new TransactionRequest
                    {
                        Amount = "1.00",
                        Source = LedgerEntrySource.Deposit,
                        IdempotencyKey = Guid.NewGuid().ToString()
                    }, "capture-manager", default);
                Require(result.Error is null);
            }
        });
        var capturing = Task.Run(async () =>
        {
            await start.Task;

            for (var iteration = 0; iteration < 10; iteration++)
            {
                await using var database = new PocketMonkeyDbContext(options);
                var captured = await new FinancialSnapshotService(database, settings, TimeProvider.System).CaptureAsync(default);
                FinancialSnapshotValidation.Validate(captured);
            }
        });
        var pruning = Task.Run(async () =>
        {
            await start.Task;
            await using var database = new PocketMonkeyDbContext(options);
            var retention = new TransactionRetention(database, settings,
                new RecoveryClock { Now = new DateTimeOffset(2029, 1, 15, 12, 0, 0, TimeSpan.Zero) },
                NullLogger<TransactionRetention>.Instance);
            Require(await retention.RunAsync(default) == 2);
        });
        start.SetResult();
        await Task.WhenAll(posting, capturing, pruning);

        await using var finalDatabase = new PocketMonkeyDbContext(options);
        Require(await finalDatabase.Accounts.Where(account => account.Id == accountId)
            .Select(account => account.BalanceMinorUnits).SingleAsync() == 2250);
    }

    private static async Task CheckFileFailuresAsync(string root)
    {
        var path = Path.Combine(root, "file-failures");
        var source = FinancialScenarioFixtures.All()["signed-balances"];
        var now = FinancialScenarioFixtures.ReferenceTime;
        var store = new FinancialExportStore(path, 0);
        store.Prepare();
        Require(await store.CheckAsync(_ => Task.FromResult(source), now, "UTC", default));
        var baseline = Directory.GetFiles(path, "pocket-monkey-*.json").Single();
        var statePath = Path.Combine(path, ".export-state.json");
        var state = await File.ReadAllTextAsync(statePath);
        var changed = source with
        {
            SnapshotId = Guid.NewGuid().ToString(),
            CapturedAtUtc = now.AddDays(1),
            Timezone = "Europe/Berlin"
        };
        using var cancelled = new CancellationTokenSource();
        var interruptedPath = Path.Combine(root, "interrupted-write");
        var interrupted = new FinancialExportStore(interruptedPath, 30);
        interrupted.Prepare();

        try
        {
            await interrupted.CheckAsync(_ =>
            {
                cancelled.Cancel();
                return Task.FromResult(changed);
            }, now.AddDays(1), "UTC", cancelled.Token);
            throw new InvalidOperationException("Interrupted publication succeeded.");
        }
        catch (OperationCanceledException)
        {
        }

        Require(Directory.GetFiles(interruptedPath).Length == 0);
        Require(await File.ReadAllTextAsync(statePath) == state && File.Exists(baseline));
        Require(Directory.GetFiles(path, "pocket-monkey-*.json").Length == 1
            && Directory.GetFiles(path, "*.tmp").Length == 0);

        if (!OperatingSystem.IsWindows())
        {
            var mode = File.GetUnixFileMode(path);

            try
            {
                File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserExecute);

                try
                {
                    await store.CheckAsync(_ => Task.FromResult(changed), now.AddDays(1), "Europe/Berlin", default);
                    throw new InvalidOperationException("Unwritable storage accepted a publication.");
                }
                catch (UnauthorizedAccessException)
                {
                }

                Require(await File.ReadAllTextAsync(statePath) == state && File.Exists(baseline));
            }
            finally
            {
                File.SetUnixFileMode(path, mode);
            }

            var link = Path.Combine(root, "linked-export");
            Directory.CreateSymbolicLink(link, path);

            try
            {
                new FinancialExportStore(link, 30).Prepare();
                throw new InvalidOperationException("Linked export storage accepted.");
            }
            catch (IOException)
            {
            }

            Directory.Delete(link);
        }

        var orphan = Path.Combine(path, $".financial-write-{Guid.NewGuid():N}.tmp");
        await File.WriteAllTextAsync(orphan, "interrupted");

        if (!OperatingSystem.IsWindows())
        {
            File.SetUnixFileMode(orphan, UnixFileMode.UserRead | UnixFileMode.UserWrite);
        }

        store.Prepare();
        Require(!File.Exists(orphan));
        Require(await store.CheckAsync(_ => Task.FromResult(changed), now.AddDays(1), "Europe/Berlin", default));
        await File.WriteAllTextAsync(statePath, "corrupt");
        Require(!await store.CheckAsync(_ => Task.FromResult(changed), now.AddDays(2), "Europe/Berlin", default));
        Require(Directory.GetFiles(path, "pocket-monkey-*.json").Length == 2);
        File.Delete(Directory.GetFiles(path, "pocket-monkey-*.json").OrderDescending(StringComparer.Ordinal).First());
        Require(await store.CheckAsync(_ => Task.FromResult(changed), now.AddDays(2), "Europe/Berlin", default));
        var reduced = new FinancialExportStore(path, 1);
        Require(!await reduced.CheckAsync(_ => Task.FromResult(changed), now.AddDays(3), "Europe/Berlin", default));
        Require(Directory.GetFiles(path, "pocket-monkey-*.json").Length == 2);
        Require(await reduced.CheckAsync(_ => Task.FromResult(source with
        {
            SnapshotId = Guid.NewGuid().ToString(),
            CapturedAtUtc = now.AddDays(4)
        }), now.AddDays(4), "UTC", default));
        Require(Directory.GetFiles(path, "pocket-monkey-*.json").Length == 1);
    }

    private sealed class RecoveryClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; }

        public override DateTimeOffset GetUtcNow() => Now;
    }

    internal static FinancialSnapshot EmptySnapshot()
    {
        return new FinancialSnapshot
        {
            FormatVersion = 1,
            SnapshotId = Guid.NewGuid().ToString(),
            CapturedAtUtc = DateTimeOffset.UtcNow,
            ApplicationVersion = "fixture",
            Currency = "EUR",
            Timezone = "UTC",
            TransactionRetentionMonths = 24,
            Accounts = [new SnapshotAccount
            {
                Id = "10000000-0000-0000-0000-000000000001", Name = "Uninitialized", NormalizedName = "UNINITIALIZED", Balance = null
            }],
            LedgerEntries = [],
            AuditEvents = [],
            AllowanceRevisions = [],
            AllowanceExecutions = [],
            RetiredLedgerKeys = [],
            LedgerMaintenanceState = new SnapshotMaintenanceState
            {
                LastAllocatedSequenceNumber = 0,
                RetentionRevision = 0,
                LastCompletedAtUtc = null
            }
        };
    }

    internal static void Require(bool condition)
    {
        if (!condition)
        {
            throw new InvalidOperationException("Financial recovery assertion failed.");
        }
    }
}