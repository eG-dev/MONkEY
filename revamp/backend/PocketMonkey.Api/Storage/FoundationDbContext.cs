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

    public DbSet<Account> Accounts => Set<Account>();

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

        modelBuilder.Entity<Account>(accountEntity =>
        {
            accountEntity.HasKey(x => x.Id);

            accountEntity
                .Property(x => x.Id)
                .HasMaxLength(36);

            accountEntity
                .Property(x => x.Name)
                .HasMaxLength(40)
                .IsRequired();

            accountEntity
                .Property(x => x.NormalizedName)
                .HasMaxLength(40)
                .IsRequired();

            accountEntity
                .HasIndex(x => x.NormalizedName)
                .IsUnique();

            accountEntity.ToTable("Accounts", table =>
                table.HasCheckConstraint("CK_Accounts_NameLength", "length(Name) BETWEEN 1 AND 40"));
        });
    }
}