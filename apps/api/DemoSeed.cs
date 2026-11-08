using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Woodstop.Api;

public static class DemoSeed
{
    public static readonly Guid Id = Guid.Parse("11111111-1111-4111-8111-111111111111");

    public static async Task RunAsync(WoodstopDbContext db)
    {
        if (await db.Stands.AnyAsync(s => s.Id == Id))
        {
            Console.WriteLine("Demo stand already exists; no data changed.");
            return;
        }
        var observed = new DateTimeOffset(2026, 11, 1, 12, 0, 0, TimeSpan.Zero);
        db.Stands.Add(new Stand
        {
            Id = Id, Name = "Pine Bend Firewood — demo", Town = "Conway", State = "NH",
            Description = "A fictional roadside bundle stand for testing Woodstop. This is not a real seller or a verified sale location.",
            Location = new Point(-71.12, 43.98) { SRID = 4326 },
            AccessNotes = "Example only: a self-service rack beside the road. Real access and hours have not been verified.",
            PublicationState = "published", OperatingStatus = "active", Price = 6,
            PriceUnit = "bundle", PriceObservedAt = observed, PaymentMethods = "Cash (example)",
            PaymentObservedAt = observed, SourceNote = "Fictional development fixture; not field data.",
            LocationVerifiedAt = observed, CreatedAt = observed, UpdatedAt = observed, IsDemo = true
        });
        await db.SaveChangesAsync();
        Console.WriteLine($"Demo stand added: {Id}");
    }
}
