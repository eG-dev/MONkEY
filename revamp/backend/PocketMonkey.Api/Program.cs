using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Endpoints;
using PocketMonkey.Api.HostedServices;
using PocketMonkey.Api.Identity;
using PocketMonkey.Api.Operations;
using PocketMonkey.Api.Services;
using PocketMonkey.Api.Storage;

var builder = WebApplication.CreateBuilder(args);
var isOperatorCommand = args.Length > 0 && args[0] is "bootstrap-manager" or "recover-manager";

var settings = InstanceSettings.Read(builder.Configuration, builder.Environment);
settings.PrepareStorage();

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
if (!isOperatorCommand)
{
	builder.Services.AddHostedService<ImageCleanup>();
	builder.Services.AddHostedService<AllowanceWorker>();
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

await FoundationStorage.InitializeAsync(app.Services, app.Lifetime.ApplicationStopping);

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