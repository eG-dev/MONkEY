using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;
using SkiaSharp;

namespace RuntimeChecks.Tests;

internal static class ImagePersistenceCheck
{
    public static async Task RunAsync()
    {
        var root = Path.Combine(Path.GetTempPath(), $"image-persistence-{Guid.NewGuid():N}");
        var settings = new InstanceSettings { DataPath = root, Timezone = "UTC", DefaultLocale = "de-DE" };
        settings.PrepareStorage();
        var options = new DbContextOptionsBuilder<PocketMonkeyDbContext>().UseSqlite(settings.ConnectionString).Options;
        using var bitmap = new SKBitmap(512, 512);
        bitmap.Erase(SKColors.Red);
        using var encoded = SKImage.FromBitmap(bitmap).Encode(SKEncodedImageFormat.Png, 100);
        var bytes = encoded.ToArray();
        string key;

        try
        {
            await using (var database = new PocketMonkeyDbContext(options))
            {
                await database.Database.MigrateAsync();
                database.Accounts.Add(new Account { Id = "images", Name = "Images", NormalizedName = "IMAGES" });
                await database.SaveChangesAsync();
                var service = new AccountImages(database, settings, NullLogger<AccountImages>.Instance);

                if (await service.ReplaceAsync("images", "manager", Request(bytes), default) is not null)
                {
                    throw new InvalidOperationException("Valid image upload failed.");
                }

                key = (await database.Accounts.SingleAsync()).ImageKey!;
                await database.Database.ExecuteSqlRawAsync("CREATE TRIGGER fail_image BEFORE INSERT ON AuditEvents WHEN NEW.Action LIKE 'account_image_%' BEGIN SELECT RAISE(ABORT, 'probe'); END;");
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var service = new AccountImages(database, settings, NullLogger<AccountImages>.Instance);

                if (await service.ReplaceAsync("images", "manager", Request(bytes), default) != "image_unavailable")
                {
                    throw new InvalidOperationException("Audit failure did not reject replacement.");
                }
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                if ((await database.Accounts.SingleAsync()).ImageKey != key || await database.AuditEvents.CountAsync() != 1)
                {
                    throw new InvalidOperationException("Failed replacement changed the reference or audit.");
                }

                await database.Database.ExecuteSqlRawAsync("DROP TRIGGER fail_image;");
            }

            var imagesBackup = settings.ImagesPath + "-backup";
            Directory.Move(settings.ImagesPath, imagesBackup);
            await File.WriteAllTextAsync(settings.ImagesPath, "blocked storage");

            try
            {
                await using var database = new PocketMonkeyDbContext(options);
                var service = new AccountImages(database, settings, NullLogger<AccountImages>.Instance);

                if (await service.ReplaceAsync("images", "manager", Request(bytes), default) != "image_unavailable")
                {
                    throw new InvalidOperationException("Filesystem failure did not reject replacement.");
                }
            }
            finally
            {
                File.Delete(settings.ImagesPath);
                Directory.Move(imagesBackup, settings.ImagesPath);
            }

            var recent = Path.Combine(settings.ImagesPath, $"{Guid.NewGuid():N}.png");
            await File.WriteAllBytesAsync(recent, bytes);
            var unrelated = Path.Combine(settings.ImagesPath, "operator.png");
            await File.WriteAllBytesAsync(unrelated, bytes);

            foreach (var file in Directory.EnumerateFiles(settings.ImagesPath).Where(file => file != recent))
            {
                File.SetLastWriteTimeUtc(file, DateTime.UtcNow.AddDays(-2));
            }

            await using (var database = new PocketMonkeyDbContext(options))
            {
                var service = new AccountImages(database, settings, NullLogger<AccountImages>.Instance);
                await service.CollectAsync(default);
                await service.CollectAsync(default);

                if (!File.Exists(Path.Combine(settings.ImagesPath, key)) || !File.Exists(recent) || !File.Exists(unrelated)
                    || Directory.GetFiles(settings.ImagesPath).Length != 3 || (await database.Accounts.SingleAsync()).ImageKey != key)
                {
                    throw new InvalidOperationException("Cleanup removed referenced/recent/operator data or retained an old orphan.");
                }

                if (await service.RemoveAsync("images", "manager", default) is not null)
                {
                    throw new InvalidOperationException("Removal failed.");
                }

                await service.CollectAsync(default);

                if (File.Exists(Path.Combine(settings.ImagesPath, key)) || (await database.Accounts.SingleAsync()).ImageKey is not null)
                {
                    throw new InvalidOperationException("Removal cleanup or persistence failed.");
                }
            }

            Console.WriteLine("image_persistence_passed");
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            Directory.Delete(root, true);
        }
    }

    private static HttpRequest Request(byte[] bytes)
    {
        var context = new DefaultHttpContext();
        context.Request.Body = new MemoryStream(bytes);
        context.Request.ContentType = "image/png";
        context.Request.ContentLength = bytes.Length;
        return context.Request;
    }
}