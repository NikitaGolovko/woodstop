using Microsoft.EntityFrameworkCore;

namespace Woodstop.Api;

public sealed class WoodstopDbContext(DbContextOptions<WoodstopDbContext> options) : DbContext(options)
{
    public DbSet<Stand> Stands => Set<Stand>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        var stand = model.Entity<Stand>();
        stand.HasKey(s => s.Id);
        stand.Property(s => s.Name).HasMaxLength(160);
        stand.Property(s => s.Description).HasMaxLength(2000);
        stand.Property(s => s.Town).HasMaxLength(120);
        stand.Property(s => s.State).HasMaxLength(2);
        stand.Property(s => s.Location).HasColumnType("geography");
        stand.Property(s => s.Price).HasPrecision(10, 2);
        stand.Property(s => s.PriceUnit).HasMaxLength(80);
        stand.Property(s => s.PaymentMethods).HasMaxLength(300);
        stand.Property(s => s.PublicationState).HasMaxLength(20);
        stand.Property(s => s.OperatingStatus).HasMaxLength(20);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidateStands();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        ValidateStands();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ValidateStands()
    {
        foreach (var entry in ChangeTracker.Entries<Stand>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified))
            entry.Entity.Validate();
    }
}
