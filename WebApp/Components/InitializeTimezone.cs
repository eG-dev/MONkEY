using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

using MONkEY.WebApp.Utils;

namespace MONkEY.WebApp.Components
{
    public sealed class InitializeTimeZone : ComponentBase
    {
        [Inject]
        public BrowserTimeProvider TimeProvider { get; set; } = default!;

        [Inject]
        public IJSRuntime JSRuntime { get; set; } = default!;

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender && TimeProvider is BrowserTimeProvider browserTimeProvider && !browserTimeProvider.IsLocalTimeZoneSet)
            {
                try
                {
                    await using var module = await JSRuntime.InvokeAsync<IJSObjectReference>("import", "./timezone.js");
                    var timeZone = await module.InvokeAsync<string>("getBrowserTimeZone");

                    browserTimeProvider.SetBrowserTimeZone(timeZone);
                }
                catch (JSDisconnectedException)
                {
                }
            }
        }
    }
}