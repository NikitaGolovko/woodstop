using NetTopologySuite.Geometries;

namespace Woodstop.Api;

public sealed class Stand
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Town { get; set; }
    public required string State { get; set; }
    public required Point Location { get; set; }
    public string? AccessNotes { get; set; }
    public string PublicationState { get; set; } = "draft";
    public string OperatingStatus { get; set; } = "active";
    public decimal? Price { get; set; }
    public string? PriceUnit { get; set; }
    public DateTimeOffset? PriceObservedAt { get; set; }
    public string? PaymentMethods { get; set; }
    public DateTimeOffset? PaymentObservedAt { get; set; }
    public required string SourceNote { get; set; }
    public DateTimeOffset LocationVerifiedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDemo { get; set; }

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(Description)
            || string.IsNullOrWhiteSpace(Town) || string.IsNullOrWhiteSpace(SourceNote)
            || State.Length != 2)
            throw new ArgumentException("Stand identification, source and two-letter state are required.");
        if (Location is null || Location.IsEmpty || Location.SRID != 4326
            || !double.IsFinite(Location.X) || !double.IsFinite(Location.Y)
            || Location.X is < -180 or > 180 || Location.Y is < -90 or > 90)
            throw new ArgumentException("A valid WGS84 longitude/latitude point is required.");
        if (PublicationState is not ("draft" or "published" or "hidden")
            || OperatingStatus is not ("active" or "seasonal" or "closed"))
            throw new ArgumentException("Invalid stand status.");
        if (Price.HasValue && (Price < 0 || string.IsNullOrWhiteSpace(PriceUnit) || PriceObservedAt is null)
            || !Price.HasValue && (PriceUnit is not null || PriceObservedAt is not null))
            throw new ArgumentException("Price, unit and observation date must be provided together.");
        if ((PaymentMethods is null) != (PaymentObservedAt is null))
            throw new ArgumentException("Payment information needs its own observation date.");
    }
}

public sealed record StandDetail(Guid Id, string Name, string Description, string Town, string State,
    double Latitude, double Longitude, string? AccessNotes, string OperatingStatus,
    decimal? Price, string? PriceUnit, string Currency, DateTimeOffset? PriceObservedAt,
    string? PaymentMethods, DateTimeOffset? PaymentObservedAt, DateTimeOffset LocationVerifiedAt, bool IsDemo)
{
    public static StandDetail From(Stand s) => new(s.Id, s.Name, s.Description, s.Town, s.State,
        s.Location.Y, s.Location.X, s.AccessNotes, s.OperatingStatus, s.Price, s.PriceUnit, "USD",
        s.PriceObservedAt, s.PaymentMethods, s.PaymentObservedAt, s.LocationVerifiedAt, s.IsDemo);
}
