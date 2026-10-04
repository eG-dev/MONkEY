using Microsoft.EntityFrameworkCore;

namespace PocketMonkey.Api.Storage;

public sealed class FoundationDbContext : DbContext
{
    public FoundationDbContext(DbContextOptions<FoundationDbContext> options) : base(options)
    {
    }

    public DbSet<FoundationState> FoundationStates => Set<FoundationState>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .Entity<FoundationState>(x =>
            {
                x
                    .HasKey(sta => sta.Id);
                x
                    .Property(sta => sta.SampleId)
                    .HasMaxLength(36)
                    .IsRequired();
                x
                    .ToTable("FoundationState", tbl => tbl.HasCheckConstraint("CK_FoundationState_Singleton", "Id = 1"));
            });
    }
}