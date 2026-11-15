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
        await DemoSeed.RunAsync(db, includeDiscovery: false);
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

    [Fact]
    public async Task NearbySearchUsesTenMilesByDefaultAndWiderRadiusIncludesDistantStand()
    {
        var nearby = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/stands?latitude=43.99&longitude=-71.12");
        var item = Assert.Single(nearby.GetProperty("items").EnumerateArray());
        Assert.Equal(DemoSeed.Id, item.GetProperty("stand").GetProperty("id").GetGuid());
        Assert.InRange(item.GetProperty("distanceMiles").GetDouble(), 0.6, 0.8);
        Assert.DoesNotContain("sourceNote", nearby.ToString());
        var outside = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/stands?latitude=44.2&longitude=-71.12");
        Assert.Empty(outside.GetProperty("items").EnumerateArray());
        var widened = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/stands?latitude=44.2&longitude=-71.12&radiusMiles=25");
        Assert.Single(widened.GetProperty("items").EnumerateArray());
    }

    [Theory]
    [InlineData("hidden", "active")]
    [InlineData("draft", "active")]
    [InlineData("published", "closed")]
    public async Task NearbySearchExcludesNonPublicStands(string publication, string operating)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        var stand = await db.Stands.SingleAsync();
        stand.PublicationState = publication; stand.OperatingStatus = operating;
        await db.SaveChangesAsync();
        var result = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/stands?latitude=43.98&longitude=-71.12");
        Assert.Empty(result.GetProperty("items").EnumerateArray());
    }

    [Theory]
    [InlineData("latitude=91&longitude=0")]
    [InlineData("latitude=0&longitude=181")]
    [InlineData("latitude=0&longitude=0&radiusMiles=0")]
    [InlineData("latitude=0&longitude=0&radiusMiles=101")]
    [InlineData("latitude=NaN&longitude=0")]
    public async Task NearbySearchRejectsInvalidBounds(string query)
    {
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/stands?{query}")).StatusCode);
    }

    [Fact]
    public async Task DiscoverySeedIsRepeatableAndPopulatesTheInitialMapWithoutOverwritingEdits()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        await DemoSeed.RunAsync(db);
        var stand = await db.Stands.SingleAsync(s => s.Id == DemoSeed.Id);
        stand.AccessNotes = "Retain this local edit";
        await db.SaveChangesAsync();
        await DemoSeed.RunAsync(db);
        Assert.Equal(10, await db.Stands.CountAsync());
        Assert.True(await db.Stands.AllAsync(s => s.IsDemo));
        await db.Entry(stand).ReloadAsync();
        Assert.Equal("Retain this local edit", stand.AccessNotes);
        var response = await client.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/stands?latitude=43.68&longitude=-70.44");
        Assert.Equal(7, response.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task ReadableLinksAreUniqueStableAndRespectPublication()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WoodstopDbContext>();
        var stand = await db.Stands.SingleAsync();
        Assert.Equal("pine-bend-firewood-conway-nh", stand.Slug);
        var copy = (Stand)db.Entry(stand).CurrentValues.ToObject();
        copy.Id = Guid.NewGuid();
        db.Stands.Add(copy);
        await db.SaveChangesAsync();
        Assert.Equal("pine-bend-firewood-conway-nh-2", copy.Slug);
        stand.Name = "Renamed stand";
        await db.SaveChangesAsync();
        var readable = await client.GetFromJsonAsync<StandDetail>($"/api/stands/by-slug/{stand.Slug}");
        Assert.Equal(stand.Id, readable!.Id);
        Assert.Equal("Renamed stand", readable.Name);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/stands/{stand.Id}")).StatusCode);
        stand.PublicationState = "hidden";
        await db.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/stands/by-slug/{stand.Slug}")).StatusCode);
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
