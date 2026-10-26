using PocketMonkey.Host.Health;
using PocketMonkey.Host.Startup;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Endpoints;
using PocketMonkey.Host.HostedServices;
using PocketMonkey.Host.Identity;
using PocketMonkey.Host.Operations;
using PocketMonkey.Host.Services;
using PocketMonkey.Storage;

var builder = WebApplication.CreateBuilder(args);
var isOperatorCommand = args.Length > 0 && args[0] is "bootstrap-manager" or "recover-manager";

var settings = InstanceSettings.Read(builder.Configuration, builder.Environment);
settings.PrepareStorage();

if (args.Length > 0 && args[0] == "import-financial")
{
	if (args is not ["import-financial", var snapshotPath])
	{
		Console.Error.WriteLine("Usage: import-financial <absolute-json-path>");
		Environment.ExitCode = 1;
		return;
	}

	Environment.ExitCode = await FinancialImportCommand.RunAsync(settings, snapshotPath, CancellationToken.None);
	return;
}

builder.Logging.ClearProviders();

if (isOperatorCommand)
{
	builder.Logging.AddSimpleConsole(options => options.SingleLine = true);
}
else
{
	builder.Logging.AddJsonConsole();
}

builder.Logging.SetMinimumLevel(isOperatorCommand ? LogLevel.Warning : settings.LogLevel);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);

builder.Services.AddSingleton(settings);
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddLocalIdentity(builder.Environment.IsDevelopment());
builder.Services.AddScoped<AccountAdministration>();
builder.Services.AddScoped<LedgerAdministration>();
builder.Services.AddScoped<AccountImages>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<AllowanceAdministration>();
builder.Services.AddScoped<AllowanceExecutor>();
builder.Services.AddScoped<TransactionRetention>();
builder.Services.AddScoped<FinancialSnapshotService>();

if (!isOperatorCommand && settings.ExportPath is { } exportPath)
{
	var exportStore = new FinancialExportStore(exportPath, settings.ExportKeepCount);
	exportStore.Prepare();
	builder.Services.AddSingleton(exportStore);
	builder.Services.AddHostedService<FinancialExportWorker>();
}

if (!isOperatorCommand)
{
	builder.Services.AddHostedService<ImageCleanup>();
	builder.Services.AddHostedService<AllowanceWorker>();
	builder.Services.AddHostedService<TransactionRetentionWorker>();
}

builder.Services.AddDbContext<PocketMonkeyDbContext>(options => options.UseSqlite(settings.ConnectionString));

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

	if (!app.Environment.IsDevelopment() && context.Connection.RemoteIpAddress is { } address &&
		System.Net.IPAddress.IsLoopback(address))
	{
		context.Request.Scheme = "https";
	}

	await next(context);
});

await BackendInitialization.InitializeAsync(app.Services, app.Lifetime.ApplicationStopping);

if (isOperatorCommand)
{
	Environment.ExitCode = await OperatorCommands.RunAsync(app.Services, args[0], app.Lifetime.ApplicationStopping);

	return;
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.Use(async (context, next) =>
{
	if (context.Request.Path.StartsWithSegments("/api") &&
		!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
	{
		try
		{
			await context.RequestServices
				.GetRequiredService<IAntiforgery>()
				.ValidateRequestAsync(context);
		}
		catch (AntiforgeryValidationException)
		{
			context.Response.StatusCode = StatusCodes.Status400BadRequest;
			await context.Response.WriteAsJsonAsync(new { code = "csrf_invalid" }, context.RequestAborted);

			return;
		}
	}

	await next(context);
});

app.MapGet("/health/live", () => Results.Ok(new { status = "healthy" }));
app.MapHealthChecks("/health/ready");

app.MapAuthentication();
app.MapUsers();
app.MapAccounts();
app.MapAccountImages();
app.MapOpeningBalances();
app.MapTransactions();
app.MapAllowances();

if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
}

app.Run();