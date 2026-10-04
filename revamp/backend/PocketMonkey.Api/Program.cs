using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Endpoints;
using PocketMonkey.Api.Storage;

var builder = WebApplication.CreateBuilder(args);

var settings = InstanceSettings.Read(builder.Configuration, builder.Environment);
settings.PrepareStorage();

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
builder.Logging.SetMinimumLevel(settings.LogLevel);

builder.Services.AddSingleton(settings);
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

builder.Services
	.AddDbContext<FoundationDbContext>(x => x.UseSqlite(settings.ConnectionString));

builder.Services
    .AddHealthChecks()
    .AddCheck<StorageReadinessCheck>("storage");

builder.Services
    .AddDataProtection()
	.SetApplicationName("POCKET MONkEY")
	.PersistKeysToFileSystem(new DirectoryInfo(settings.KeysPath));

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.Use(async (context, next) =>
{
	context.Response.Headers.CacheControl = "no-store";
	await next(context);
});

await FoundationStorage.InitializeAsync(app.Services, app.Lifetime.ApplicationStopping);

app.MapGet("/health/live", () => Results.Ok(new { status = "healthy" }));
app.MapHealthChecks("/health/ready");

app.MapFoundation();

if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
}

app.Run();