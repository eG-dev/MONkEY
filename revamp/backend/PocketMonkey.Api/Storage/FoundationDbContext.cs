using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Entities;

namespace PocketMonkey.Api.Storage;

public sealed class FoundationDbContext : IdentityDbContext<ApplicationUser>
{
    public FoundationDbContext(DbContextOptions<FoundationDbContext> options) : base(options)
    {
    }

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<Account> Accounts => Set<Account>();

    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(userEntity =>
        {
            userEntity
                .Property(x => x.Theme)
                .HasMaxLength(6)
                .HasDefaultValue("system")
                .IsRequired();

            userEntity.ToTable(table =>
                table.HasCheckConstraint("CK_AspNetUsers_Theme", "Theme IN ('system', 'light', 'dark')"));
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
            {
                table.HasCheckConstraint("CK_Accounts_NameLength", "length(Name) BETWEEN 1 AND 40");
                table.HasCheckConstraint("CK_Accounts_Balance", "BalanceMinorUnits IS NULL OR typeof(BalanceMinorUnits) = 'integer'");
            });
        });

        modelBuilder.Entity<LedgerEntry>(entryEntity =>
        {
            entryEntity.HasKey(x => x.Id);

            entryEntity
                .Property(x => x.Source)
                .HasConversion(
                    source => source.ToString().ToLowerInvariant(),
                    value => Enum.Parse<LedgerEntrySource>(value, true));

            entryEntity
                .HasIndex(x => x.IdempotencyKey)
                .IsUnique();

            entryEntity
                .HasIndex(x => x.SequenceNumber)
                .IsUnique();

            entryEntity
                .HasIndex(entry => new { entry.AccountId, entry.SequenceNumber })
                .IsDescending(false, true);

            entryEntity
                .HasIndex(x => x.AccountId)
                .HasFilter("Source = 'opening'")
                .IsUnique();

            entryEntity
                .HasOne<Account>()
                .WithMany(account => account.LedgerEntries)
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            entryEntity.ToTable("LedgerEntries", table =>
            {
                table.HasCheckConstraint("CK_LedgerEntries_Amount", "typeof(AmountMinorUnits) = 'integer' AND (Source = 'opening' OR (Source = 'deposit' AND AmountMinorUnits > 0) OR (Source = 'withdrawal' AND AmountMinorUnits < 0))");
                table.HasCheckConstraint("CK_LedgerEntries_Source", "Source IN ('opening', 'deposit', 'withdrawal')");
                table.HasCheckConstraint("CK_LedgerEntries_Sequence", "typeof(SequenceNumber) = 'integer' AND SequenceNumber > 0");
                table.HasCheckConstraint("CK_LedgerEntries_Comment", "Comment IS NULL OR length(Comment) <= 500");
                table.HasCheckConstraint("CK_LedgerEntries_Key", "length(IdempotencyKey) = 36");
            });
        });
    }
}