using Microsoft.AspNetCore.Components.Rendering;
using Microsoft.AspNetCore.Components;

using MONkEY.WebApp.Utils;
using MONkEY.WebApp.Services;

namespace MONkEY.WebApp.Components.Timezone
{
    public sealed class LocalTime : ComponentBase, IDisposable
    {
        [Inject]
        public ITimeZoneService TimeZoneService { get; set; } = default!;

        [Inject]
        public BrowserTimeProvider BrowserTimeProvider { get; set; } = default!;

        [Parameter]
        public DateTime? DateTime { get; set; }

        [Parameter]
        public string? Format { get; set; }

        protected override void OnInitialized()
        {
            BrowserTimeProvider.LocalTimeZoneChanged += LocalTimeZoneChanged;
        }

        protected override void BuildRenderTree(RenderTreeBuilder builder)
        {
            if (DateTime != null)
            {
                if (!string.IsNullOrEmpty(Format))
                {
                    builder.AddContent(0, TimeZoneService.Format(DateTime.Value, Format));
                }
                else
                {
                    builder.AddContent(0, TimeZoneService.Format(DateTime.Value, "g"));
                }
            }
        }

        public void Dispose()
        {
            BrowserTimeProvider.LocalTimeZoneChanged -= LocalTimeZoneChanged;
        }

        private void LocalTimeZoneChanged(object? sender, EventArgs e)
        {
            _ = InvokeAsync(StateHasChanged);
        }
    }
}