using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Entities;

namespace PocketMonkey.Api.Storage;

public sealed class FoundationDbContext : IdentityDbContext<ApplicationUser>
{
    public FoundationDbContext(DbContextOptions<FoundationDbContext> options) : base(options)
    {
    }

    public DbSet<FoundationState> FoundationStates => Set<FoundationState>();

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<FoundationState>(stateEntity =>
        {
            stateEntity.HasKey(x => x.Id);

            stateEntity
                .Property(x => x.SampleId)
                .HasMaxLength(36)
                .IsRequired();

            stateEntity.ToTable("FoundationState", table =>
                table.HasCheckConstraint("CK_FoundationState_Singleton", "Id = 1"));
        });
    }
}