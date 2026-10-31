using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Storage.Entities;

namespace PocketMonkey.Storage;

public sealed class PocketMonkeyDbContext : IdentityDbContext<ApplicationUser>
{
    public PocketMonkeyDbContext(DbContextOptions<PocketMonkeyDbContext> options) : base(options)
    {
    }

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<Account> Accounts => Set<Account>();

    public DbSet<MemberAccountAssignment> MemberAccountAssignments => Set<MemberAccountAssignment>();

    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();

    public DbSet<AllowanceRevision> AllowanceRevisions => Set<AllowanceRevision>();

    public DbSet<AllowanceExecution> AllowanceExecutions => Set<AllowanceExecution>();

    public DbSet<LedgerMaintenanceState> LedgerMaintenanceStates => Set<LedgerMaintenanceState>();

    public DbSet<RetiredLedgerKey> RetiredLedgerKeys => Set<RetiredLedgerKey>();

    public DbSet<PendingImageDeletion> PendingImageDeletions => Set<PendingImageDeletion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<LedgerMaintenanceState>(stateEntity =>
        {
            stateEntity
                .HasKey(x => x.Id);

            stateEntity
                .Property(x => x.Id)
                .ValueGeneratedNever();

            stateEntity.ToTable("LedgerMaintenanceStates", table =>
            {
                table.HasCheckConstraint("CK_LedgerMaintenanceStates_Singleton", "Id = 1");
                table.HasCheckConstraint("CK_LedgerMaintenanceStates_Sequence", "typeof(LastAllocatedSequenceNumber) = 'integer' AND LastAllocatedSequenceNumber >= 0");
                table.HasCheckConstraint("CK_LedgerMaintenanceStates_Revision", "typeof(RetentionRevision) = 'integer' AND RetentionRevision >= 0");
            });
        });

        modelBuilder.Entity<RetiredLedgerKey>(stateEntity =>
        {
            stateEntity
                .HasKey(x => x.IdempotencyKey);

            stateEntity
                .Property(x => x.IdempotencyKey)
                .HasMaxLength(36)
                .IsRequired();

            stateEntity
                .HasOne<Account>()
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            stateEntity.ToTable("RetiredLedgerKeys", table =>
                table.HasCheckConstraint("CK_RetiredLedgerKeys_Key", "length(IdempotencyKey) = 36"));
        });

        modelBuilder.Entity<PendingImageDeletion>(stateEntity =>
        {
            stateEntity
                .HasKey(x => x.ImageKey);

            stateEntity
                .Property(x => x.ImageKey)
                .HasMaxLength(36);
        });

        modelBuilder.Entity<AllowanceExecution>(stateEntity =>
        {
            stateEntity
                .HasKey(execution => execution.Id);

            stateEntity
                .HasIndex(execution => new { execution.AccountId, execution.BusinessMonth })
                .IsUnique();

            stateEntity
                .HasIndex(execution => execution.IdempotencyKey)
                .IsUnique();

            stateEntity
                .HasOne<Account>()
                .WithMany()
                .HasForeignKey(execution => execution.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            stateEntity
                .HasOne<AllowanceRevision>()
                .WithMany()
                .HasForeignKey(execution => execution.RevisionId)
                .HasPrincipalKey(revision => revision.Id)
                .OnDelete(DeleteBehavior.Restrict);

            stateEntity.ToTable("AllowanceExecutions", table =>
            {
                table.HasCheckConstraint("CK_AllowanceExecutions_Month", "BusinessMonth BETWEEN 101 AND 999912 AND BusinessMonth % 100 BETWEEN 1 AND 12");
                table.HasCheckConstraint("CK_AllowanceExecutions_Attempts", "Attempts >= 0");
                table.HasCheckConstraint("CK_AllowanceExecutions_Outcome", "CreditedAtUtc IS NULL OR DroppedAtUtc IS NULL");
            });
        });

        modelBuilder.Entity<AllowanceRevision>(revisionEntity =>
        {
            revisionEntity
                .HasKey(x => x.SequenceNumber);

            revisionEntity
                .Property(x => x.SequenceNumber)
                .ValueGeneratedOnAdd();

            revisionEntity
                .HasIndex(x => x.Id)
                .IsUnique();

            revisionEntity
                .HasIndex(revision => new { revision.AccountId, revision.PreviousRevisionId })
                .IsUnique();

            revisionEntity
                .HasOne<Account>()
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            revisionEntity.ToTable("AllowanceRevisions", table =>
            {
                table.HasCheckConstraint("CK_AllowanceRevisions_Amount", "(AmountMinorUnits IS NULL AND Enabled = 0) OR (typeof(AmountMinorUnits) = 'integer' AND AmountMinorUnits > 0)");
                table.HasCheckConstraint("CK_AllowanceRevisions_Month", "EffectiveMonth BETWEEN 101 AND 999912 AND EffectiveMonth % 100 BETWEEN 1 AND 12");
            });
        });

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

        modelBuilder.Entity<MemberAccountAssignment>(assignmentEntity =>
        {
            assignmentEntity
                .HasKey(assignment => new { assignment.UserId, assignment.AccountId });

            assignmentEntity
                .HasIndex(x => x.AccountId);

            assignmentEntity
                .HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            assignmentEntity
                .HasOne<Account>()
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Account>(accountEntity =>
        {
            accountEntity
                .HasKey(x => x.Id);

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
                .Property(x => x.ImageKey)
                .HasMaxLength(36);

            accountEntity
                .Property(x => x.RetiredAtUtc)
                .HasConversion(
                    value => value.HasValue ? value.Value.UtcDateTime : (DateTime?)null,
                    value => value.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)) : null);

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
            entryEntity
                .HasKey(x => x.Id);

            entryEntity
                .HasIndex(entry => new { entry.OccurredAtUtc, entry.SequenceNumber });

            entryEntity
                .Property(x => x.OccurredAtUtc)
                .HasConversion(
                    value => value.UtcDateTime,
                    value => new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc)));

            entryEntity
                .Property(x => x.Source)
                .HasConversion(
                    source => source.ToString().ToLowerInvariant(),
                    value => Enum.Parse<LedgerEntrySource>(value, true));

            entryEntity
                .HasIndex(x => x.IdempotencyKey)
                .IsUnique();

            entryEntity
                .HasIndex(entry => new { entry.AccountId, entry.AllowanceMonth })
                .HasFilter("AllowanceMonth IS NOT NULL")
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
                table.HasCheckConstraint("CK_LedgerEntries_Amount", "typeof(AmountMinorUnits) = 'integer' AND (Source = 'opening' OR (Source IN ('deposit', 'allowance') AND AmountMinorUnits > 0) OR (Source = 'withdrawal' AND AmountMinorUnits < 0))");
                table.HasCheckConstraint("CK_LedgerEntries_Source", "Source IN ('opening', 'deposit', 'withdrawal', 'allowance')");
                table.HasCheckConstraint("CK_LedgerEntries_AllowanceMonth", "(Source = 'allowance' AND AllowanceMonth IS NOT NULL AND AllowanceMonth BETWEEN 101 AND 999912 AND AllowanceMonth % 100 BETWEEN 1 AND 12) OR (Source <> 'allowance' AND AllowanceMonth IS NULL)");
                table.HasCheckConstraint("CK_LedgerEntries_Sequence", "typeof(SequenceNumber) = 'integer' AND SequenceNumber > 0");
                table.HasCheckConstraint("CK_LedgerEntries_Comment", "Comment IS NULL OR length(Comment) <= 500");
                table.HasCheckConstraint("CK_LedgerEntries_Key", "length(IdempotencyKey) = 36");
            });
        });
    }
}