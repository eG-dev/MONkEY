using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Configuration;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Endpoints;

public static class FoundationEndpoints
{
    public static void MapFoundation(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app
            .MapGet("/api/foundation", async (FoundationDbContext database, InstanceSettings settings, CancellationToken cancellationToken) =>
            {
                var state = await database.FoundationStates
                    .AsNoTracking()
                    .SingleAsync(cancellationToken);

                return TypedResults.Ok(new FoundationResponse
                {
                    SampleId = state.SampleId,
                    InitializedAtUtc = state.InitializedAtUtc,
                    Timezone = settings.Timezone
                });
            })
            .WithName("GetFoundation");

        app
            .MapGet("/api/foundation/file", (InstanceSettings x) =>
                TypedResults.PhysicalFile(x.SampleFilePath, "text/plain", "foundation.txt"))
            .WithName("GetFoundationFile");
    }
}