using Azure.Data.Tables;
using Azure.Storage.Blobs;
using Cropper.Blazor.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.UI;
using MudBlazor;
using MudBlazor.Services;
using MudBlazor.Translations;

using MONkEY.Data.Services;
using MONkEY.WebApp.Components;
using MONkEY.WebApp.Services;
using MONkEY.WebApp.Utils;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMicrosoftIdentityWebAppAuthentication(builder.Configuration);

builder.Services.AddScoped<BrowserTimeProvider>();

builder.Services.AddControllersWithViews(options =>
{
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.CacheProfiles.Add("Images", new CacheProfile()
    {
        Duration = 2592000,
        Location = ResponseCacheLocation.Any
    });
    options.CacheProfiles.Add("NoCache", new CacheProfile()
    {
        Location = ResponseCacheLocation.None,
        NoStore = true
    });

    options.Filters.Add(new AuthorizeFilter(policy));
}).AddMicrosoftIdentityUI();

builder.Services.AddApplicationInsightsTelemetry();

builder.Services.AddLocalization();

// Add services to the container.
builder.Services
    .AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddHubOptions(options =>
    {
        // These options are needed for Cropper to work correctly!
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        options.EnableDetailedErrors = false;
        options.HandshakeTimeout = TimeSpan.FromSeconds(15);
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.MaximumParallelInvocationsPerClient = 1;
        options.MaximumReceiveMessageSize = 32 * 1024 * 100;
        options.StreamBufferCapacity = 10;
    });

builder.Services.AddMudServices(config =>
{
    config.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.TopCenter;

    config.SnackbarConfiguration.PreventDuplicates = false;
    config.SnackbarConfiguration.NewestOnTop = false;
    config.SnackbarConfiguration.ShowCloseIcon = true;
    config.SnackbarConfiguration.VisibleStateDuration = 2000;
    config.SnackbarConfiguration.HideTransitionDuration = 500;
    config.SnackbarConfiguration.ShowTransitionDuration = 500;
    config.SnackbarConfiguration.SnackbarVariant = Variant.Filled;
});
builder.Services.AddMudTranslations();

builder.Services.AddCropper();

var storageConnectionString = builder.Configuration.GetConnectionString("TableStorage");
TableServiceClient tableServiceClient = new(storageConnectionString);
BlobContainerClient blobContainerClient = new(storageConnectionString, "images");

builder.Services.AddSingleton(sp => tableServiceClient);
builder.Services.AddSingleton(sp => blobContainerClient);

builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IBlobService, BlobService>();

builder.Services.AddScoped<AccountManagementService>();

var app = builder.Build();

#pragma warning disable ASP0000 // Do not call 'IServiceCollection.BuildServiceProvider' in 'ConfigureServices'
var serviceProvider = builder.Services.BuildServiceProvider();
#pragma warning restore ASP0000 // Do not call 'IServiceCollection.BuildServiceProvider' in 'ConfigureServices'

var accountService = serviceProvider.GetService<IAccountService>();
await accountService!.InitAsync();

var transactionService = serviceProvider.GetService<ITransactionService>();
await transactionService!.InitAsync();

var reportService = serviceProvider.GetService<IReportService>();
await reportService!.InitAsync();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAntiforgery();

app.MapControllers();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

//app.UseRequestLocalization("de-DE");

app.Run();
