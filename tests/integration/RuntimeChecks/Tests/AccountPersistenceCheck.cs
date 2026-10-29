using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

namespace RuntimeChecks.Tests;

internal static class AccountPersistenceCheck
{
    public static async Task RunLifecycleAsync()
    {
        var root = Path.Combine(Path.GetTempPath(), $"account-lifecycle-{Guid.NewGuid():N}");
        Directory.CreateDirectory(root);
        var settings = new InstanceSettings { DataPath = root, Timezone = "UTC", DefaultLocale = "en-US" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite(settings.ConnectionString).Options;
        var clock = new LifecycleClock { Now = new DateTimeOffset(2026, 10, 15, 12, 0, 0, TimeSpan.Zero) };

        try
        {
            await using var database = new PocketMonkeyDbContext(options);
            await database.Database.MigrateAsync();
            database.Users.Add(new ApplicationUser { Id = "manager", UserName = "manager", DisplayName = "Manager" });
            await database.SaveChangesAsync();
            var administration = new AccountAdministration(database, settings, clock);
            var ledger = new LedgerAdministration(database, settings, clock);
            var immediate = (await administration.CreateAsync(new CreateAccountRequest { Name = "Immediate" }, "manager", default)).Account!;
            Require((await ledger.PostOpeningAsync(immediate.Id, new OpeningBalanceRequest
            {
                Amount = "0.00", IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            var immediateResult = await administration.DeleteAsync(immediate.Id, "manager", default);
            Require(immediateResult.Error is null && immediateResult.PurgeAtUtc is null);
            Require(await administration.FindAsync(immediate.Id, default) is null);

            var account = (await administration.CreateAsync(new CreateAccountRequest { Name = "Retired" }, "manager", default)).Account!;
            Require((await ledger.PostOpeningAsync(account.Id, new OpeningBalanceRequest
            {
                Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            Require((await ledger.PostTransactionAsync(account.Id, new TransactionRequest
            {
                Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            var revision = new AllowanceRevision
            {
                AccountId = account.Id, PreviousRevisionId = "", ActorId = "manager", OccurredAtUtc = clock.Now,
                EffectiveMonth = 202610, Enabled = true, AmountMinorUnits = 200
            };
            database.AllowanceRevisions.Add(revision);
            var legacyKey = Guid.NewGuid().ToString();
            database.RetiredLedgerKeys.Add(new RetiredLedgerKey { IdempotencyKey = legacyKey, RetiredAtUtc = clock.Now });
            database.RetiredLedgerKeys.Add(new RetiredLedgerKey
            {
                IdempotencyKey = Guid.NewGuid().ToString(), AccountId = account.Id, RetiredAtUtc = clock.Now
            });
            var entity = await database.Accounts.SingleAsync(item => item.Id == account.Id);
            entity.ImageKey = "0123456789abcdef0123456789abcdef.png";
            await database.SaveChangesAsync();

            var retired = await administration.DeleteAsync(account.Id, "manager", default);
            Require(retired.Error is null && retired.PurgeAtUtc == clock.Now.AddDays(30));
            Require((await administration.DeleteAsync(account.Id, "manager", default)).PurgeAtUtc == retired.PurgeAtUtc);
            Require((await administration.ListAsync(default)).All(item => item.Id != account.Id));
            Require((await administration.ListRetiredAsync(default)).Single().PurgeAtUtc == retired.PurgeAtUtc);
            Require((await ledger.PostTransactionAsync(account.Id, new TransactionRequest
            {
                Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error == LedgerError.AccountRetired);
            Require(await administration.ReactivateAsync(account.Id, null, "manager", default) == "missed_allowance_policy_required");
            Require(await administration.ReactivateAsync(account.Id, "invalid", "manager", default) == "invalid_missed_allowance_policy");
            Require(await administration.ReactivateAsync(account.Id, "drop", "manager", default) is null);
            Require(await database.AllowanceExecutions.AnyAsync(execution => execution.AccountId == account.Id && execution.DroppedAtUtc != null));
            var dropExecutor = new AllowanceExecutor(database, ledger, settings, clock, NullLogger<AllowanceExecutor>.Instance);
            await dropExecutor.RunAsync(default);
            database.ChangeTracker.Clear();
            Require(await database.Accounts.Where(item => item.Id == account.Id).Select(item => item.BalanceMinorUnits).SingleAsync() == 1100);
            var snapshot = await new FinancialSnapshotService(database, settings, clock).CaptureAsync(default);
            FinancialSnapshotValidation.Validate(snapshot);
            Require(snapshot.FormatVersion == 2 && snapshot.AllowanceExecutions.Single().DroppedAtUtc == clock.Now);
            Require(snapshot.RetiredLedgerKeys.Any(key => key.AccountId == account.Id));
            Require((await administration.DeleteAsync(account.Id, "manager", default)).PurgeAtUtc == clock.Now.AddDays(30));
            clock.Now = clock.Now.AddDays(30);
            Require(await administration.ReactivateAsync(account.Id, "credit", "manager", default) == "account_deletion_expired");

            await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER RejectAccountPurge BEFORE DELETE ON Accounts BEGIN SELECT RAISE(ABORT, 'fixture failure'); END;");

            try
            {
                await administration.PurgeDueAsync(default);
                throw new InvalidOperationException("Account purge should have failed.");
            }
            catch (DbUpdateException)
            {
            }

            database.ChangeTracker.Clear();
            Require(await database.Accounts.AnyAsync(item => item.Id == account.Id));
            Require(await database.LedgerEntries.AnyAsync(entry => entry.AccountId == account.Id));
            await database.Database.ExecuteSqlRawAsync("DROP TRIGGER RejectAccountPurge;");
            await administration.PurgeDueAsync(default);
            database.ChangeTracker.Clear();
            Require(!await database.Accounts.AnyAsync(item => item.Id == account.Id));
            Require(!await database.LedgerEntries.AnyAsync(entry => entry.AccountId == account.Id));
            Require(!await database.AuditEvents.AnyAsync(audit => audit.SubjectId == account.Id));
            Require(!await database.RetiredLedgerKeys.AnyAsync(key => key.AccountId == account.Id));
            Require(await database.RetiredLedgerKeys.AnyAsync(key => key.IdempotencyKey == legacyKey));
            Require(await database.PendingImageDeletions.AnyAsync(item => item.ImageKey == "0123456789abcdef0123456789abcdef.png"));

            Directory.CreateDirectory(settings.ImagesPath);
            var imagePath = Path.Combine(settings.ImagesPath, "0123456789abcdef0123456789abcdef.png");
            Directory.CreateDirectory(imagePath);
            var images = new AccountImages(database, settings, NullLogger<AccountImages>.Instance);

            try
            {
                await images.CollectPendingAsync(default);
                throw new InvalidOperationException("Image cleanup should have failed.");
            }
            catch (Exception failure) when (failure is IOException or UnauthorizedAccessException)
            {
            }

            Require(await database.PendingImageDeletions.AnyAsync());
            Directory.Delete(imagePath);
            await File.WriteAllTextAsync(imagePath, "image");
            await images.CollectPendingAsync(default);
            Require(!File.Exists(imagePath) && !await database.PendingImageDeletions.AnyAsync());

            database.ChangeTracker.Clear();
            var creditAccount = (await administration.CreateAsync(new CreateAccountRequest { Name = "Credit" }, "manager", default)).Account!;
            Require((await ledger.PostOpeningAsync(creditAccount.Id, new OpeningBalanceRequest
            {
                Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            Require((await ledger.PostTransactionAsync(creditAccount.Id, new TransactionRequest
            {
                Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            database.AllowanceRevisions.Add(new AllowanceRevision
            {
                AccountId = creditAccount.Id, PreviousRevisionId = "", ActorId = "manager", OccurredAtUtc = clock.Now,
                EffectiveMonth = 202611, Enabled = true, AmountMinorUnits = 200
            });
            await database.SaveChangesAsync();
            Require((await administration.DeleteAsync(creditAccount.Id, "manager", default)).Error is null);
            Require(await administration.ReactivateAsync(creditAccount.Id, "credit", "manager", default) is null);
            var executor = new AllowanceExecutor(database, ledger, settings, clock, NullLogger<AllowanceExecutor>.Instance);
            await executor.RunAsync(default);
            await executor.RunAsync(default);
            database.ChangeTracker.Clear();
            Require(await database.Accounts.Where(item => item.Id == creditAccount.Id).Select(item => item.BalanceMinorUnits).SingleAsync() == 1300);
            Require(await database.AllowanceExecutions.CountAsync(execution => execution.AccountId == creditAccount.Id && execution.CreditedAtUtc != null) == 1);

            clock.Now = new DateTimeOffset(2026, 9, 10, 12, 0, 0, TimeSpan.Zero);
            database.ChangeTracker.Clear();
            var historyAccount = (await administration.CreateAsync(new CreateAccountRequest { Name = "Historical allowance" }, "manager", default)).Account!;
            Require((await ledger.PostOpeningAsync(historyAccount.Id, new OpeningBalanceRequest
            {
                Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            Require((await ledger.PostTransactionAsync(historyAccount.Id, new TransactionRequest
            {
                Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            var allowance = new AllowanceAdministration(database, settings, clock);
            var firstRevision = await allowance.SaveAsync(historyAccount.Id, new AllowanceRequest
            {
                Enabled = true, Amount = "1.00"
            }, "manager", default);
            Require(firstRevision.Error is null);
            clock.Now = new DateTimeOffset(2026, 10, 10, 12, 0, 0, TimeSpan.Zero);
            var secondRevision = await allowance.SaveAsync(historyAccount.Id, new AllowanceRequest
            {
                Enabled = true, Amount = "2.00", ExpectedRevisionId = firstRevision.Configuration!.LatestRevisionId
            }, "manager", default);
            Require(secondRevision.Error is null);
            clock.Now = new DateTimeOffset(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);
            Require((await administration.DeleteAsync(historyAccount.Id, "manager", default)).PurgeAtUtc is not null);
            Require(await administration.ReactivateAsync(historyAccount.Id, "credit", "manager", default) is null);
            await executor.RunAsync(default);
            await executor.RunAsync(default);
            database.ChangeTracker.Clear();
            var historicalCredits = await database.LedgerEntries.AsNoTracking()
                .Where(entry => entry.AccountId == historyAccount.Id && entry.Source == LedgerEntrySource.Allowance)
                .OrderBy(entry => entry.SequenceNumber)
                .Select(entry => entry.AmountMinorUnits)
                .ToListAsync();
            Require(historicalCredits.SequenceEqual(new long[] { 100, 200 }));
            clock.Now = new DateTimeOffset(2026, 12, 1, 12, 0, 0, TimeSpan.Zero);
            await executor.RunAsync(default);
            Require(await database.LedgerEntries.CountAsync(entry => entry.AccountId == historyAccount.Id && entry.Source == LedgerEntrySource.Allowance) == 3);

            foreach (var policy in new[] { "credit", "drop" })
            {
                clock.Now = new DateTimeOffset(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);
                database.ChangeTracker.Clear();
                var boundaryAccount = (await administration.CreateAsync(new CreateAccountRequest { Name = $"Boundary {policy}" }, "manager", default)).Account!;
                Require((await ledger.PostOpeningAsync(boundaryAccount.Id, new OpeningBalanceRequest
                {
                    Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
                }, "manager", default)).Error is null);
                Require((await ledger.PostTransactionAsync(boundaryAccount.Id, new TransactionRequest
                {
                    Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
                }, "manager", default)).Error is null);
                var currentSetting = await allowance.SaveAsync(boundaryAccount.Id, new AllowanceRequest
                {
                    Enabled = true, Amount = "1.00"
                }, "manager", default);
                Require(currentSetting.Error is null);
                clock.Now = new DateTimeOffset(2026, 12, 10, 12, 0, 0, TimeSpan.Zero);
                var scheduledSetting = await allowance.SaveAsync(boundaryAccount.Id, new AllowanceRequest
                {
                    Enabled = true, Amount = "2.00", ExpectedRevisionId = currentSetting.Configuration!.LatestRevisionId
                }, "manager", default);
                Require(scheduledSetting.Error is null);
                var pendingKey = Guid.NewGuid().ToString();
                database.AllowanceExecutions.Add(new AllowanceExecution
                {
                    AccountId = boundaryAccount.Id, BusinessMonth = 202612,
                    RevisionId = currentSetting.Configuration!.LatestRevisionId!, IdempotencyKey = pendingKey,
                    Attempts = 1, LastAttemptAtUtc = clock.Now, ErrorCode = "execution_failed"
                });
                await database.SaveChangesAsync();
                var revisionIds = await database.AllowanceRevisions.AsNoTracking()
                    .Where(item => item.AccountId == boundaryAccount.Id)
                    .OrderBy(item => item.SequenceNumber)
                    .Select(item => item.Id)
                    .ToListAsync();

                clock.Now = new DateTimeOffset(2026, 12, 20, 12, 0, 0, TimeSpan.Zero);
                Require((await administration.DeleteAsync(boundaryAccount.Id, "manager", default)).PurgeAtUtc == clock.Now.AddDays(30));
                Require((await database.AllowanceRevisions.AsNoTracking()
                    .Where(item => item.AccountId == boundaryAccount.Id)
                    .OrderBy(item => item.SequenceNumber)
                    .Select(item => item.Id)
                    .ToListAsync()).SequenceEqual(revisionIds));
                await executor.RunAsync(default);
                clock.Now = new DateTimeOffset(2027, 1, 1, 12, 0, 0, TimeSpan.Zero);
                await executor.RunAsync(default);
                var pending = await database.AllowanceExecutions.AsNoTracking().SingleAsync(item => item.AccountId == boundaryAccount.Id);
                Require(pending.Attempts == 1 && pending.CreditedAtUtc is null && pending.DroppedAtUtc is null && pending.ErrorCode == "execution_failed");
                Require(await administration.ReactivateAsync(boundaryAccount.Id, null, "manager", default) == "missed_allowance_policy_required");
                Require(await administration.ReactivateAsync(boundaryAccount.Id, policy, "manager", default) is null);
                await using (var restartedDatabase = new PocketMonkeyDbContext(options))
                {
                    var restartedLedger = new LedgerAdministration(restartedDatabase, settings, clock);
                    var restartedExecutor = new AllowanceExecutor(restartedDatabase, restartedLedger, settings, clock, NullLogger<AllowanceExecutor>.Instance);
                    await restartedExecutor.RunAsync(default);
                    await restartedExecutor.RunAsync(default);
                }

                database.ChangeTracker.Clear();
                var missedCredits = await database.LedgerEntries.AsNoTracking()
                    .Where(entry => entry.AccountId == boundaryAccount.Id && entry.Source == LedgerEntrySource.Allowance)
                    .OrderBy(entry => entry.SequenceNumber)
                    .Select(entry => entry.AmountMinorUnits)
                    .ToListAsync();
                Require(missedCredits.SequenceEqual(policy == "credit" ? new long[] { 100, 200 } : Array.Empty<long>()));
                Require((await database.AllowanceExecutions.AsNoTracking().SingleAsync(item => item.AccountId == boundaryAccount.Id && item.BusinessMonth == 202612)).IdempotencyKey == pendingKey);
                Require(await database.AllowanceExecutions.CountAsync(item => item.AccountId == boundaryAccount.Id && item.DroppedAtUtc != null) == (policy == "drop" ? 2 : 0));
                var restoredSetting = await allowance.FindAsync(boundaryAccount.Id, default);
                Require(restoredSetting!.Current!.Enabled && restoredSetting.Current.Amount == "2.00" && restoredSetting.LatestRevisionId == scheduledSetting.Configuration!.LatestRevisionId);

                clock.Now = new DateTimeOffset(2027, 2, 1, 12, 0, 0, TimeSpan.Zero);
                await executor.RunAsync(default);
                await executor.RunAsync(default);
                var futureCredits = await database.LedgerEntries.AsNoTracking()
                    .Where(entry => entry.AccountId == boundaryAccount.Id && entry.Source == LedgerEntrySource.Allowance)
                    .OrderBy(entry => entry.SequenceNumber)
                    .Select(entry => entry.AmountMinorUnits)
                    .ToListAsync();
                Require(futureCredits.SequenceEqual(policy == "credit" ? new long[] { 100, 200, 200 } : new long[] { 200 }));
            }

            clock.Now = new DateTimeOffset(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);
            database.ChangeTracker.Clear();
            var disabledAccount = (await administration.CreateAsync(new CreateAccountRequest { Name = "Disabled allowance" }, "manager", default)).Account!;
            Require((await ledger.PostOpeningAsync(disabledAccount.Id, new OpeningBalanceRequest
            {
                Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            Require((await ledger.PostTransactionAsync(disabledAccount.Id, new TransactionRequest
            {
                Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
            }, "manager", default)).Error is null);
            var disabledSetting = await allowance.SaveAsync(disabledAccount.Id, new AllowanceRequest { Enabled = false }, "manager", default);
            Require(disabledSetting.Error is null);
            clock.Now = new DateTimeOffset(2026, 12, 20, 12, 0, 0, TimeSpan.Zero);
            Require((await administration.DeleteAsync(disabledAccount.Id, "manager", default)).PurgeAtUtc is not null);
            clock.Now = new DateTimeOffset(2027, 1, 1, 12, 0, 0, TimeSpan.Zero);
            Require(await administration.ReactivateAsync(disabledAccount.Id, null, "manager", default) is null);
            await executor.RunAsync(default);
            var restoredDisabled = await allowance.FindAsync(disabledAccount.Id, default);
            Require(!restoredDisabled!.Current!.Enabled && restoredDisabled.LatestRevisionId == disabledSetting.Configuration!.LatestRevisionId);
            Require(!await database.AllowanceExecutions.AnyAsync(item => item.AccountId == disabledAccount.Id));

            for (var attempt = 0; attempt < 3; attempt++)
            {
                clock.Now = new DateTimeOffset(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);
                database.ChangeTracker.Clear();
                var accountWithAllowance = (await administration.CreateAsync(new CreateAccountRequest { Name = $"Concurrent allowance {attempt}" }, "manager", default)).Account!;
                Require((await ledger.PostOpeningAsync(accountWithAllowance.Id, new OpeningBalanceRequest
                {
                    Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
                }, "manager", default)).Error is null);
                Require((await ledger.PostTransactionAsync(accountWithAllowance.Id, new TransactionRequest
                {
                    Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
                }, "manager", default)).Error is null);
                Require((await allowance.SaveAsync(accountWithAllowance.Id, new AllowanceRequest
                {
                    Enabled = true, Amount = "2.00"
                }, "manager", default)).Error is null);

                clock.Now = new DateTimeOffset(2026, 12, 15, 12, 0, 0, TimeSpan.Zero);
                await using var scanDatabase = new PocketMonkeyDbContext(options);
                await using var retirementDatabase = new PocketMonkeyDbContext(options);
                var scanLedger = new LedgerAdministration(scanDatabase, settings, clock);
                var concurrentExecutor = new AllowanceExecutor(scanDatabase, scanLedger, settings, clock, NullLogger<AllowanceExecutor>.Instance);
                var concurrentRetirement = new AccountAdministration(retirementDatabase, settings, clock);
                var scan = Task.Run(() => concurrentExecutor.RunAsync(default));
                var retirement = Task.Run(() => concurrentRetirement.DeleteAsync(accountWithAllowance.Id, "manager", default));
                await Task.WhenAll(scan, retirement);
                Require(retirement.Result.PurgeAtUtc is not null);
                database.ChangeTracker.Clear();
                var creditedBeforeReactivation = await database.LedgerEntries.CountAsync(entry => entry.AccountId == accountWithAllowance.Id && entry.Source == LedgerEntrySource.Allowance);
                Require(creditedBeforeReactivation <= 1);
                await executor.RunAsync(default);
                Require(await database.LedgerEntries.CountAsync(entry => entry.AccountId == accountWithAllowance.Id && entry.Source == LedgerEntrySource.Allowance) == creditedBeforeReactivation);
                Require(await administration.ReactivateAsync(accountWithAllowance.Id, "drop", "manager", default) is null);
                await executor.RunAsync(default);
                Require(await database.LedgerEntries.CountAsync(entry => entry.AccountId == accountWithAllowance.Id && entry.Source == LedgerEntrySource.Allowance) == creditedBeforeReactivation);
                clock.Now = new DateTimeOffset(2027, 1, 1, 12, 0, 0, TimeSpan.Zero);
                await executor.RunAsync(default);
                Require(await database.LedgerEntries.CountAsync(entry => entry.AccountId == accountWithAllowance.Id && entry.Source == LedgerEntrySource.Allowance) == creditedBeforeReactivation + 1);
            }

            for (var attempt = 0; attempt < 3; attempt++)
            {
                database.ChangeTracker.Clear();
                var concurrent = (await administration.CreateAsync(new CreateAccountRequest { Name = $"Concurrent {attempt}" }, "manager", default)).Account!;
                Require((await ledger.PostOpeningAsync(concurrent.Id, new OpeningBalanceRequest
                {
                    Amount = "10.00", IdempotencyKey = Guid.NewGuid().ToString()
                }, "manager", default)).Error is null);
                await using var postDatabase = new PocketMonkeyDbContext(options);
                await using var deleteDatabase = new PocketMonkeyDbContext(options);
                var concurrentLedger = new LedgerAdministration(postDatabase, settings, clock);
                var concurrentAccounts = new AccountAdministration(deleteDatabase, settings, clock);
                var posting = Task.Run(() => concurrentLedger.PostTransactionAsync(concurrent.Id, new TransactionRequest
                {
                    Amount = "1.00", Source = LedgerEntrySource.Deposit, IdempotencyKey = Guid.NewGuid().ToString()
                }, "manager", default));
                var deletion = Task.Run(() => concurrentAccounts.DeleteAsync(concurrent.Id, "manager", default));
                await Task.WhenAll(posting, deletion);
                database.ChangeTracker.Clear();
                var remaining = await database.Accounts.SingleOrDefaultAsync(item => item.Id == concurrent.Id);

                if (posting.Result.Error is null)
                {
                    Require(deletion.Result.PurgeAtUtc is not null && remaining?.BalanceMinorUnits == 1100 && remaining.RetiredAtUtc is not null);
                }
                else
                {
                    Require(posting.Result.Error == LedgerError.NotFound && deletion.Result.PurgeAtUtc is null && remaining is null);
                }
            }
            Console.WriteLine("account_lifecycle_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            Directory.Delete(root, true);
        }
    }

    private static void Require(bool condition)
    {
        if (!condition)
        {
            throw new InvalidOperationException("Account lifecycle assertion failed.");
        }
    }

    private sealed class LifecycleClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; }

        public override DateTimeOffset GetUtcNow() => Now;
    }

    public static async Task RunAsync()
    {
        var path = Path.Combine(Path.GetTempPath(), $"account-persistence-{Guid.NewGuid():N}.db");
        var settings = new InstanceSettings { DataPath = Path.GetDirectoryName(path)!, Timezone = "UTC", DefaultLocale = "de-DE" };
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>()
            .UseSqlite($"Data Source={path};Foreign Keys=True")
            .Options;

        try
        {
            string secondId;

            await using (var database = new PocketMonkeyDbContext(options))
            {
                await database.Database.MigrateAsync();

                var administration = new AccountAdministration(database, settings);
                var first = await administration.CreateAsync(new CreateAccountRequest { Name = "First" }, "probe-manager", default);
                var second = await administration.CreateAsync(new CreateAccountRequest { Name = "Second" }, "probe-manager", default);

                if (first.Error is not null || second.Error is not null)
                {
                    throw new InvalidOperationException("Account setup failed.");
                }

                secondId = second.Account?.Id ?? throw new InvalidOperationException("Account identity was not returned.");
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var administration = new AccountAdministration(database, settings);

                var duplicate = await administration.CreateAsync(new CreateAccountRequest { Name = "FIRST" }, "probe-manager", default);

                if (duplicate.Error != AccountError.DuplicateName)
                {
                    throw new InvalidOperationException("Duplicate creation did not produce the expected conflict.");
                }
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var administration = new AccountAdministration(database, settings);

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

            await using (var database = new PocketMonkeyDbContext(options))
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

            await using (var database = new PocketMonkeyDbContext(options))
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