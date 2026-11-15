using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Woodstop.Api;

public static class DemoSeed
{
    public static readonly Guid Id = Guid.Parse("11111111-1111-4111-8111-111111111111");

    public static async Task RunAsync(WoodstopDbContext db, bool includeDiscovery = true)
    {
        var observed = new DateTimeOffset(2026, 11, 1, 12, 0, 0, TimeSpan.Zero);
        var stands = new List<Stand> { new Stand
        {
            Id = Id, Name = "Pine Bend Firewood — demo", Town = "Conway", State = "NH",
            Description = "A fictional roadside bundle stand for testing Woodstop. This is not a real seller or a verified sale location.",
            Location = new Point(-71.12, 43.98) { SRID = 4326 },
            AccessNotes = "Example only: a self-service rack beside the road. Real access and hours have not been verified.",
            PublicationState = "published", OperatingStatus = "active", Price = 6,
            PriceUnit = "bundle", PriceObservedAt = observed, PaymentMethods = "Cash (example)",
            PaymentObservedAt = observed, SourceNote = "Fictional development fixture; not field data.",
            LocationVerifiedAt = observed, CreatedAt = observed, UpdatedAt = observed, IsDemo = true
        } };
        if (includeDiscovery)
        {
            // Fictional positions for interface testing, not advertised sellers.
            var examples = new (string Name, string Town, double Latitude, double Longitude, decimal? Price, string? Payment, bool Seasonal)[]
            {
                ("Maple Corner", "Gorham", 43.680, -70.440, 6m, "Cash (example)", false),
                ("Cedar Rack", "Gorham", 43.683, -70.445, 7m, "Cash or mobile payment (example)", false),
                ("Brookside Bundles", "Buxton", 43.650, -70.530, 5m, "Cash (example)", false),
                ("Pine Hollow", "Buxton", 43.654, -70.535, null, null, false),
                ("Meadow Road", "Scarborough", 43.600, -70.390, 8m, "Cash (example)", false),
                ("Birch Bend", "Standish", 43.730, -70.550, null, null, true),
                ("North Woods", "Windham", 43.800, -70.420, 7m, null, false),
                ("Lakeside Rack", "Raymond", 43.900, -70.470, 6m, "Cash (example)", true),
                ("Camp Road", "Casco", 43.930, -70.580, 8m, "Cash or mobile payment (example)", false)
            };
            for (var index = 0; index < examples.Length; index++)
            {
                var example = examples[index];
                stands.Add(new Stand
                {
                    Id = Guid.Parse($"22222222-2222-4222-8222-{index + 1:D12}"),
                    Name = $"{example.Name} — demo", Town = example.Town, State = "ME",
                    Description = "Fictional sample listing for testing Woodstop. No seller, stand, price or access at this pin has been verified. Do not travel to this location.",
                    Location = new Point(example.Longitude, example.Latitude) { SRID = 4326 },
                    AccessNotes = "Sample pin only. Opening hours and real access are unknown.",
                    PublicationState = "published", OperatingStatus = example.Seasonal ? "seasonal" : "active",
                    Price = example.Price, PriceUnit = example.Price.HasValue ? "bundle" : null,
                    PriceObservedAt = example.Price.HasValue ? observed : null,
                    PaymentMethods = example.Payment, PaymentObservedAt = example.Payment is not null ? observed : null,
                    SourceNote = "Fictional development fixture; not field data.",
                    LocationVerifiedAt = observed, CreatedAt = observed, UpdatedAt = observed, IsDemo = true
                });
            }
        }
        var ids = stands.Select(s => s.Id).ToArray();
        var existing = await db.Stands.Where(s => ids.Contains(s.Id)).Select(s => s.Id).ToListAsync();
        var added = stands.Where(s => !existing.Contains(s.Id)).ToArray();
        db.Stands.AddRange(added);
        await db.SaveChangesAsync();
        Console.WriteLine($"Added {added.Length} fictional demo stands; existing records were left unchanged.");
    }
}
