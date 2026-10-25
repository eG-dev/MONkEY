using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

namespace PocketMonkey.Host.Operations;

public static class FinancialImportCommand
{
    public static async Task<int> RunAsync(InstanceSettings settings, string path, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(settings);

        try
        {
            if (!Path.IsPathFullyQualified(path))
            {
                throw new InvalidDataException("snapshot_invalid");
            }

            FinancialExportStore.RejectLinks(path);
            FinancialExportStore.RejectLinks(settings.DataPath);

            var snapshot = await FinancialSnapshotJson.ReadAsync(path, cancellationToken);
            FinancialSnapshotValidation.Validate(snapshot);

            if (snapshot.Currency != settings.Currency || snapshot.Timezone != settings.Timezone
                || snapshot.TransactionRetentionMonths != settings.TransactionRetentionMonths)
            {
                throw new InvalidDataException("snapshot_configuration_mismatch");
            }

            await using var connection = new SqliteConnection(settings.ConnectionString);
            await connection.OpenAsync(cancellationToken);

            await using (var command = connection.CreateCommand())
            {
                command.CommandText = "PRAGMA locking_mode=EXCLUSIVE;";
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite(connection).Options;
            await using var database = new PocketMonkeyDbContext(options);

            await database.Database.MigrateAsync(cancellationToken);

            var service = new FinancialSnapshotService(database, settings, TimeProvider.System);
            await service.ImportAsync(snapshot, cancellationToken);

            Console.WriteLine("financial_import_success");

            return 0;
        }
        catch (SqliteException failure) when (failure.SqliteErrorCode is 5 or 6)
        {
            Console.Error.WriteLine("recovery_storage_busy");
        }
        catch (DbUpdateException failure) when (failure.InnerException is SqliteException { SqliteErrorCode: 5 or 6 })
        {
            Console.Error.WriteLine("recovery_storage_busy");
        }
        catch (InvalidDataException failure)
        {
            Console.Error.WriteLine(failure.Message);
        }
        catch (Exception failure) when (failure is JsonException or IOException or UnauthorizedAccessException
            or DbUpdateException or SqliteException or OverflowException)
        {
            Console.Error.WriteLine("snapshot_invalid");
        }

        return 1;
    }
}