using System.Data;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Storage;
using SkiaSharp;

namespace PocketMonkey.Host.Services;

public sealed class AccountImages
{
    public const int MaximumBytes = 2 * 1024 * 1024;
    public const int MaximumDimension = 512;
    private readonly PocketMonkeyDbContext database;
    private readonly InstanceSettings settings;
    private readonly ILogger<AccountImages> logger;

    public AccountImages(PocketMonkeyDbContext database, InstanceSettings settings, ILogger<AccountImages> logger)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<string?> ReplaceAsync(string id, string actor, HttpRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == id, cancellationToken);

        if (account is null)
        {
            return "not_found";
        }

        if (account.RetiredAtUtc is not null)
        {
            return "account_retired";
        }

        using var input = new MemoryStream();
        var buffer = new byte[8192];

        while (true)
        {
            var read = await request.Body.ReadAsync(buffer, cancellationToken);

            if (read == 0)
            {
                break;
            }

            if (input.Length + read > MaximumBytes)
            {
                try
                {
                    await request.Body.CopyToAsync(Stream.Null, cancellationToken);
                }
                catch (BadHttpRequestException failure) when (failure.StatusCode == StatusCodes.Status413PayloadTooLarge)
                {
                    return "image_too_large";
                }

                return "image_too_large";
            }

            input.Write(buffer, 0, read);
        }

        input.Position = 0;
        using var codec = SKCodec.Create(input);

        if (codec is null)
        {
            return "invalid_image";
        }

        var contentType = codec.EncodedFormat switch
        {
            SKEncodedImageFormat.Png => "image/png",
            SKEncodedImageFormat.Jpeg => "image/jpeg",
            SKEncodedImageFormat.Webp => "image/webp",

            _ => null
        };

        if (contentType is null || request.ContentType?.Split(';')[0].Trim().ToLowerInvariant() != contentType || codec.FrameCount > 1)
        {
            return "invalid_image";
        }

        if (codec.Info.Width is < 1 or > MaximumDimension || codec.Info.Height is < 1 or > MaximumDimension)
        {
            return "image_dimensions";
        }

        using var bitmap = new SKBitmap(new SKImageInfo(codec.Info.Width, codec.Info.Height, SKColorType.Bgra8888, SKAlphaType.Premul));

        if (codec.GetPixels(bitmap.Info, bitmap.GetPixels()) != SKCodecResult.Success)
        {
            return "invalid_image";
        }

        using var image = SKImage.FromBitmap(bitmap);
        using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
        var key = $"{Guid.NewGuid():N}.png";
        var path = Path.Combine(settings.ImagesPath, key);

        try
        {
            var options = new FileStreamOptions
            {
                Mode = FileMode.CreateNew,
                Access = FileAccess.Write,
                Share = FileShare.None,
                Options = FileOptions.Asynchronous
            };

            if (!OperatingSystem.IsWindows())
            {
                options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
            }

            await using (var output = new FileStream(path, options))
            {
                await output.WriteAsync(encoded.ToArray(), cancellationToken);
                output.Flush(true);
            }

            await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            await database.Entry(account).ReloadAsync(cancellationToken);

            if (database.Entry(account).State == EntityState.Detached || account.RetiredAtUtc is not null)
            {
                File.Delete(path);
                return database.Entry(account).State == EntityState.Detached ? "not_found" : "account_retired";
            }

            account.ImageKey = key;
            AddAudit(id, actor, "account_image_replaced");
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return null;
        }
        catch (Exception failure) when (failure is IOException or UnauthorizedAccessException or DbUpdateException)
        {
            logger.LogError(failure, "Account image replacement failed for {AccountId}", id);
            return "image_unavailable";
        }
    }

    public async Task<string?> RemoveAsync(string id, string actor, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var account = await database.Accounts.SingleOrDefaultAsync(account => account.Id == id, cancellationToken);

        if (account is null)
        {
            return "not_found";
        }

        if (account.RetiredAtUtc is not null)
        {
            return "account_retired";
        }

        if (account.ImageKey is null)
        {
            return null;
        }

        account.ImageKey = null;
        AddAudit(id, actor, "account_image_removed");
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return null;
    }

    public async Task<Stream?> OpenAsync(string id, CancellationToken cancellationToken)
    {
        var key = await database.Accounts
            .Where(account => account.Id == id)
            .Select(account => account.ImageKey)
            .SingleOrDefaultAsync(cancellationToken);

        if (!IsGeneratedKey(key))
        {
            return null;
        }

        try
        {
            return new FileStream(Path.Combine(settings.ImagesPath, key!), FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete);
        }
        catch (Exception failure) when (failure is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(failure, "Account image unavailable for {AccountId}", id);
            return null;
        }
    }

    public async Task CollectPendingAsync(CancellationToken cancellationToken)
    {
        var pending = await database.PendingImageDeletions.AsNoTracking().ToListAsync(cancellationToken);

        foreach (var item in pending)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!IsGeneratedKey(item.ImageKey))
            {
                throw new InvalidDataException("Invalid pending account image key.");
            }

            if (await database.Accounts.AnyAsync(account => account.ImageKey == item.ImageKey, cancellationToken))
            {
                continue;
            }

            File.Delete(Path.Combine(settings.ImagesPath, item.ImageKey));
            await database.PendingImageDeletions.Where(candidate => candidate.ImageKey == item.ImageKey)
                .ExecuteDeleteAsync(cancellationToken);
        }
    }

    public async Task CollectAsync(CancellationToken cancellationToken)
    {
        var referenced = (await database.Accounts
            .Where(account => account.ImageKey != null)
            .Select(account => account.ImageKey!)
            .ToListAsync(cancellationToken)).ToHashSet(StringComparer.Ordinal);
        var cutoff = DateTime.UtcNow.AddHours(-24);

        foreach (var path in Directory.EnumerateFiles(settings.ImagesPath, "*.png"))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var key = Path.GetFileName(path);

            if (IsGeneratedKey(key) && !referenced.Contains(key) && File.GetLastWriteTimeUtc(path) < cutoff)
            {
                File.Delete(path);
            }
        }
    }

    private static bool IsGeneratedKey(string? key) => key is { Length: 36 } && key.EndsWith(".png", StringComparison.Ordinal)
        && Guid.TryParseExact(key[..32], "N", out _);

    private void AddAudit(string id, string actor, string action) => database.AuditEvents.Add(new AuditEvent
    {
        ActorId = actor,
        SubjectId = id,
        Action = action,
        OccurredAtUtc = DateTimeOffset.UtcNow
    });
}