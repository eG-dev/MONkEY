using Azure.Data.Tables;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.UI;
using WebApp.Components;
using WebApp.Models;
using WebApp.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMicrosoftIdentityWebAppAuthentication(builder.Configuration);

builder.Services.AddControllersWithViews(options =>
{
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.Filters.Add(new AuthorizeFilter(policy));
}).AddMicrosoftIdentityUI();

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var tableStorageConnectionString = builder.Configuration.GetConnectionString("TABLE_STORAGE_CONNECTION_STRING");

if (!string.IsNullOrEmpty(tableStorageConnectionString))
{
    TableServiceClient tableServiceClient = new TableServiceClient(tableStorageConnectionString);
    TableClient tableClient = tableServiceClient.GetTableClient(
        tableName: "accounts"
    );

    var response = await tableClient.CreateIfNotExistsAsync();

    if (response.GetRawResponse().Status != 409)
    {
        var accountService = new AccountService(tableClient);

        await accountService.Insert(new Account() { Name = "Luis", Balance = 0 });
        await accountService.Insert(new Account() { Name = "Jonas", Balance = 0 });
        await accountService.Insert(new Account() { Name = "Charlotte", Balance = 0 });
    }

    builder.Services.AddTransient(sp => tableClient);

    builder.Services.AddTransient<AccountService>();
}

var app = builder.Build();

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

app.Run();
