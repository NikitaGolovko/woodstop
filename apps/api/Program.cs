using Microsoft.EntityFrameworkCore;
using Woodstop.Api;
using NetTopologySuite.Geometries;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<WoodstopDbContext>(options => options.UseSqlServer(
    builder.Configuration.GetConnectionString("Woodstop")
        ?? throw new InvalidOperationException("Set ConnectionStrings:Woodstop using dotnet user-secrets."),
    sql => sql.UseNetTopologySuite()));
var app = builder.Build();
app.UseExceptionHandler();

if (args.Contains("--seed-demo"))
{
    if (!app.Environment.IsDevelopment())
        throw new InvalidOperationException("Demo seeding is only allowed in Development.");
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
    await DemoSeed.RunAsync(db);
    return;
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/stands", async (double latitude, double longitude, double? radiusMiles,
    WoodstopDbContext db, CancellationToken cancellation) =>
{
    var radius = radiusMiles ?? 10;
    if (!double.IsFinite(latitude) || latitude is < -90 or > 90
        || !double.IsFinite(longitude) || longitude is < -180 or > 180
        || !double.IsFinite(radius) || radius is <= 0 or > 100)
        return Results.BadRequest(new { message = "Use valid coordinates and a radius greater than zero and at most 100 miles." });

    var origin = new Point(longitude, latitude) { SRID = 4326 };
    // Distance is translated to SQL Server geography.STDistance (meters).
    var matches = await db.Stands.AsNoTracking()
        .Where(s => s.PublicationState == "published" && s.OperatingStatus != "closed")
        .Where(s => s.Location.Distance(origin) <= radius * 1609.344)
        .OrderBy(s => s.Location.Distance(origin)).ThenBy(s => s.Id)
        .Take(201)
        .Select(s => new { Stand = s, DistanceMeters = s.Location.Distance(origin) })
        .ToListAsync(cancellation);
    return Results.Ok(new
    {
        items = matches.Take(200).Select(s => new { stand = StandDetail.From(s.Stand), distanceMiles = s.DistanceMeters / 1609.344 }),
        truncated = matches.Count > 200
    });
});
app.MapGet("/api/stands/{id:guid}", async (Guid id, WoodstopDbContext db, CancellationToken cancellation) =>
{
    var stand = await db.Stands.AsNoTracking()
        .Where(s => s.Id == id && s.PublicationState == "published" && s.OperatingStatus != "closed")
        .SingleOrDefaultAsync(cancellation);
    return stand is null ? Results.NotFound() : Results.Ok(StandDetail.From(stand));
});

app.Run();

public partial class Program;
