using Microsoft.EntityFrameworkCore;
using Woodstop.Api;

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
app.MapGet("/api/stands/{id:guid}", async (Guid id, WoodstopDbContext db, CancellationToken cancellation) =>
{
    var stand = await db.Stands.AsNoTracking()
        .Where(s => s.Id == id && s.PublicationState == "published" && s.OperatingStatus != "closed")
        .SingleOrDefaultAsync(cancellation);
    return stand is null ? Results.NotFound() : Results.Ok(StandDetail.From(stand));
});

app.Run();

public partial class Program;
