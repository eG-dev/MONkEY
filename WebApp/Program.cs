using Cropper.Blazor.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.UI;
using MudBlazor;
using MudBlazor.Services;
using MudBlazor.Translations;
using System.Globalization;

using MONkEY.WebApp;
using MONkEY.WebApp.Components;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMicrosoftIdentityWebAppAuthentication(builder.Configuration);

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

builder.Services
    .AddMudServices(config =>
    {
        config.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.TopCenter;

        config.SnackbarConfiguration.PreventDuplicates = false;
        config.SnackbarConfiguration.NewestOnTop = false;
        config.SnackbarConfiguration.ShowCloseIcon = true;
        config.SnackbarConfiguration.VisibleStateDuration = 2000;
        config.SnackbarConfiguration.HideTransitionDuration = 500;
        config.SnackbarConfiguration.ShowTransitionDuration = 500;
        config.SnackbarConfiguration.SnackbarVariant = Variant.Filled;
    })
    .AddLocalization()
    .AddMudTranslations();

builder.Services.AddCropper();

builder.Services.AddMemoryCache();

builder.Services
    .AddBrowserTimeSupport()
    .AddCustomAzureStorage(builder.Configuration)
    .AddCustomServices();

var app = builder.Build();

await app.InitStorage();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
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

app.UseRequestLocalization("de-DE");

var culture = CultureInfo.CreateSpecificCulture("de-DE");
CultureInfo.CurrentCulture = culture;
CultureInfo.CurrentUICulture = culture;

app.Run();
