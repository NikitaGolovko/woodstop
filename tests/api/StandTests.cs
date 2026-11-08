using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NetTopologySuite.Geometries;
using Woodstop.Api;
using Xunit;

public sealed class StandTests : IAsyncLifetime
{
    private readonly string database = $"WoodstopTests_{Guid.NewGuid():N}";
    private WebApplicationFactory<Program> factory = null!;
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("ConnectionStrings:Woodstop", $"Server=(localdb)\\MSSQLLocalDB;Database={database};Integrated Security=true;Encrypt=true;TrustServerCertificate=true");
        });
        client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        await db.Database.MigrateAsync();
        await DemoSeed.RunAsync(db);
    }

    [Fact]
    public async Task PublishedStandPreservesCoordinatesDatesAndHidesPrivateSource()
    {
        var response = await client.GetAsync($"/api/stands/{DemoSeed.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var stand = (await response.Content.ReadFromJsonAsync<StandDetail>())!;
        Assert.Equal(43.98, stand.Latitude, 5);
        Assert.Equal(-71.12, stand.Longitude, 5);
        Assert.Equal(6m, stand.Price);
        Assert.Equal(new DateTimeOffset(2026, 11, 1, 12, 0, 0, TimeSpan.Zero), stand.PriceObservedAt);
        Assert.True(stand.IsDemo);
        Assert.DoesNotContain("sourceNote", await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("hidden", "active")]
    [InlineData("draft", "active")]
    [InlineData("published", "closed")]
    public async Task NonPublicStandsReturn404(string publication, string operating)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        var stand = await db.Stands.SingleAsync();
        stand.PublicationState = publication; stand.OperatingStatus = operating;
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/stands/{DemoSeed.Id}")).StatusCode);
    }

    [Fact]
    public async Task UnknownFactsRemainNullAndMissingIdReturns404()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        var stand = await db.Stands.SingleAsync();
        stand.Price = null; stand.PriceUnit = null; stand.PriceObservedAt = null;
        stand.PaymentMethods = null; stand.PaymentObservedAt = null;
        await db.SaveChangesAsync();
        var detail = (await client.GetFromJsonAsync<StandDetail>($"/api/stands/{stand.Id}"))!;
        Assert.Null(detail.Price); Assert.Null(detail.PaymentMethods); Assert.Null(detail.PaymentObservedAt);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/stands/{Guid.NewGuid()}")).StatusCode);
    }

    [Theory]
    [InlineData(181, 0)] [InlineData(0, 91)] [InlineData(double.NaN, 0)]
    public async Task InvalidCoordinatesCannotBeSaved(double longitude, double latitude)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        var stand = await db.Stands.SingleAsync();
        stand.Location = new Point(longitude, latitude) { SRID = 4326 };
        await Assert.ThrowsAsync<ArgumentException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task GeographyDistancesAreMeasuredInMeters()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        var nearby = new Point(-71.12, 43.99) { SRID = 4326 };
        var distance = await db.Stands.Select(s => s.Location.Distance(nearby)).SingleAsync();
        Assert.InRange(distance, 1000, 1200);
    }

    public async Task DisposeAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        if (db.Database.GetDbConnection().Database != database)
            throw new InvalidOperationException("Refusing to remove a database outside this test fixture.");
        await db.Database.EnsureDeletedAsync();
        client.Dispose(); await factory.DisposeAsync();
    }
}
