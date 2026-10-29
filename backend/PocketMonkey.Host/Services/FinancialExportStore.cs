using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using PocketMonkey.Host.Contracts.Recovery;

namespace PocketMonkey.Host.Services;

public sealed partial class FinancialExportStore
{
    private readonly string directory;
    private readonly int keepCount;

    public FinancialExportStore(string directory, int keepCount)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(directory);

        if (!Path.IsPathFullyQualified(directory) || keepCount is < 0 or > 365)
        {
            throw new InvalidOperationException("Invalid export configuration.");
        }

        this.directory = Path.GetFullPath(directory);
        this.keepCount = keepCount;
    }

    public void Prepare()
    {
        RejectLinks(directory);

        if (OperatingSystem.IsWindows())
        {
            Directory.CreateDirectory(directory);
        }
        else
        {
            Directory.CreateDirectory(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            RequirePrivate(directory);
        }

        var probe = Path.Combine(directory, $".financial-write-{Guid.NewGuid():N}.tmp");
        using (CreatePrivate(probe))
        {
        }

        File.Delete(probe);

        foreach (var temporary in Directory.EnumerateFiles(directory, ".financial-write-*.tmp"))
        {
            if (TemporaryName().IsMatch(Path.GetFileName(temporary)))
            {
                RejectLinks(temporary);
                RequirePrivate(temporary);
                File.Delete(temporary);
            }
        }
    }

    public async Task<bool> CheckAsync(Func<CancellationToken, Task<FinancialSnapshot>> capture,
        DateTimeOffset now, string timezone, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(capture);
        var slot = DueSlot(now, timezone);
        var statePath = Path.Combine(directory, ".export-state.json");
        RejectLinks(directory);
        RejectLinks(statePath);
        var latestPath = CompletedFiles().FirstOrDefault();
        var previous = latestPath is null ? null : await ReadCompatibleAsync(latestPath, cancellationToken);
        ExportState? state = null;

        if (File.Exists(statePath))
        {
            RequirePrivate(statePath);
            try
            {
                if (new FileInfo(statePath).Length <= 4096)
                {
                    state = JsonSerializer.Deserialize<ExportState>(await File.ReadAllTextAsync(statePath, cancellationToken));
                }
            }
            catch (JsonException)
            {
            }
        }

        if (previous is not null && state is { Version: 1 } && state.SlotUtc == slot && state.Timezone == timezone
            && latestPath is not null && state.Baseline == Path.GetFileName(latestPath))
        {
            return false;
        }

        var current = await capture(cancellationToken);
        FinancialSnapshotValidation.Validate(current);
        var publish = true;

        if (previous is not null)
        {
            publish = ContentHash(previous) != ContentHash(current);
        }

        if (publish)
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(Canonical(current), FinancialSnapshotJson.Options);

            if (bytes.LongLength > FinancialSnapshotJson.MaximumFileBytes)
            {
                throw new InvalidDataException("snapshot_invalid");
            }

            var filename = $"pocket-monkey-{current.CapturedAtUtc:yyyyMMdd'T'HHmmssfffffff'Z'}-{current.SnapshotId.Replace("-", "")}.json";
            latestPath = Path.Combine(directory, filename);
            await PublishAsync(latestPath, bytes, false, cancellationToken);

            if (keepCount > 0)
            {
                var compatibleCount = 0;

                foreach (var old in CompletedFiles())
                {
                    if (await ReadCompatibleAsync(old, cancellationToken) is not null && ++compatibleCount > keepCount)
                    {
                        File.Delete(old);
                    }
                }
            }
        }

        var next = new ExportState
        {
            Version = 1,
            SlotUtc = slot,
            Timezone = timezone,
            Baseline = Path.GetFileName(latestPath!)
        };
        await PublishAsync(statePath, JsonSerializer.SerializeToUtf8Bytes(next), true, cancellationToken);

        return publish;
    }

    public static string ContentHash(FinancialSnapshot snapshot)
    {
        var content = Canonical(snapshot) with
        {
            SnapshotId = Guid.Empty.ToString(),
            CapturedAtUtc = DateTimeOffset.UnixEpoch,
            ApplicationVersion = "",
            LedgerMaintenanceState = snapshot.LedgerMaintenanceState with { LastCompletedAtUtc = null }
        };

        return Convert.ToHexStringLower(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(content, FinancialSnapshotJson.Options)));
    }

    public static DateTimeOffset DueSlot(DateTimeOffset now, string timezone)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(timezone);
        var date = TimeZoneInfo.ConvertTime(now, zone).Date;

        while (true)
        {
            var local = DateTime.SpecifyKind(date.AddHours(1), DateTimeKind.Unspecified);

            while (zone.IsInvalidTime(local))
            {
                local = local.AddMinutes(1);
            }

            var offset = zone.IsAmbiguousTime(local) ? zone.GetAmbiguousTimeOffsets(local).Max() : zone.GetUtcOffset(local);
            var slot = new DateTimeOffset(local, offset).ToUniversalTime();

            if (slot <= now)
            {
                return slot;
            }

            date = date.AddDays(-1);
        }
    }

    public static void RejectLinks(string path)
    {
        var current = Path.GetFullPath(path);

        while (!string.IsNullOrEmpty(current))
        {
            if ((File.Exists(current) || Directory.Exists(current))
                && (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
            {
                throw new IOException("Recovery paths must not contain symbolic links or reparse points.");
            }

            current = Path.GetDirectoryName(current);
        }
    }

    private static FinancialSnapshot Canonical(FinancialSnapshot snapshot)
    {
        return snapshot with
        {
            Accounts = snapshot.Accounts.OrderBy(account => account.Id, StringComparer.Ordinal).ToArray(),
            LedgerEntries = snapshot.LedgerEntries.OrderBy(entry => entry.SequenceNumber).ToArray(),
            AuditEvents = snapshot.AuditEvents.OrderBy(audit => audit.Id).ToArray(),
            AllowanceRevisions = snapshot.AllowanceRevisions.OrderBy(revision => revision.SequenceNumber).ToArray(),
            AllowanceExecutions = snapshot.AllowanceExecutions.OrderBy(execution => execution.Id).ToArray(),
            RetiredLedgerKeys = snapshot.RetiredLedgerKeys.OrderBy(key => key.IdempotencyKey, StringComparer.Ordinal).ToArray()
        };
    }

    private string[] CompletedFiles()
    {
        return Directory.EnumerateFiles(directory, "pocket-monkey-*.json")
            .Where(path => CompletedName().IsMatch(Path.GetFileName(path)))
            .OrderDescending(StringComparer.Ordinal)
            .ToArray();
    }

    private static async Task<FinancialSnapshot?> ReadCompatibleAsync(string path, CancellationToken cancellationToken)
    {
        RejectLinks(path);
        RequirePrivate(path);

        try
        {
            var snapshot = await FinancialSnapshotJson.ReadAsync(path, cancellationToken);
            FinancialSnapshotValidation.Validate(snapshot);

            return snapshot;
        }
        catch (InvalidDataException failure) when (failure.Message == "snapshot_version_unsupported")
        {
            return null;
        }
    }

    private static void RequirePrivate(string path)
    {
        if (!OperatingSystem.IsWindows()
            && (File.GetUnixFileMode(path) & (UnixFileMode.GroupRead | UnixFileMode.GroupWrite | UnixFileMode.GroupExecute
                | UnixFileMode.OtherRead | UnixFileMode.OtherWrite | UnixFileMode.OtherExecute)) != 0)
        {
            throw new IOException("Export storage must have owner-only permissions.");
        }
    }

    private static FileStream CreatePrivate(string path)
    {
        var options = new FileStreamOptions { Mode = FileMode.CreateNew, Access = FileAccess.Write, Share = FileShare.None };

        if (!OperatingSystem.IsWindows())
        {
            options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
        }

        return new FileStream(path, options);
    }

    private async Task PublishAsync(string target, byte[] bytes, bool replace, CancellationToken cancellationToken)
    {
        var temporary = Path.Combine(directory, $".financial-write-{Guid.NewGuid():N}.tmp");

        try
        {
            await using (var stream = CreatePrivate(temporary))
            {
                await stream.WriteAsync(bytes, cancellationToken);
                stream.Flush(true);
            }

            RejectLinks(target);
            File.Move(temporary, target, replace);
        }
        finally
        {
            File.Delete(temporary);
        }
    }

    [GeneratedRegex(@"^pocket-monkey-[0-9]{8}T[0-9]{13}Z-[a-f0-9]{32}\.json$", RegexOptions.CultureInvariant)]
    private static partial Regex CompletedName();

    [GeneratedRegex(@"^\.financial-write-[a-f0-9]{32}\.tmp$", RegexOptions.CultureInvariant)]
    private static partial Regex TemporaryName();

    private sealed record ExportState
    {
        public int Version { get; init; }
        public DateTimeOffset SlotUtc { get; init; }
        public string? Timezone { get; init; }
        public string? Baseline { get; init; }
    }
}