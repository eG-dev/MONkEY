using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Host.Configuration;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Storage;

namespace PocketMonkey.Host.Services;

public sealed class AccountAdministration
{
    private readonly PocketMonkeyDbContext database;
    private readonly InstanceSettings settings;

    public AccountAdministration(PocketMonkeyDbContext database, InstanceSettings settings)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
        this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public async Task<List<AccountResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var accounts = await database.Accounts
            .AsNoTracking()
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .OrderBy(account => account.NormalizedName)
            .ThenBy(account => account.Id)
            .ToListAsync(cancellationToken);

        return accounts.Select(Describe).ToList();
    }

    public async Task<AccountResponse?> FindAsync(string id, CancellationToken cancellationToken)
    {
        var account = await database.Accounts
            .AsNoTracking()
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .Where(account => account.Id == id)
            .SingleOrDefaultAsync(cancellationToken);

        return account is null ? null : Describe(account);
    }

    public async Task<(AccountResponse? Account, AccountError? Error)> CreateAsync(
        CreateAccountRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        var name = request.Name?.Trim();

        if (name is not { Length: > 0 and <= 40 })
        {
            return (null, AccountError.InvalidName);
        }

        var account = new Account
        {
            Name = name,
            NormalizedName = name.ToUpperInvariant()
        };

        database.Accounts.Add(account);

        var error = await SaveAsync(account, actor, "account_created", cancellationToken);

        return error is null
            ? (Describe(account), null)
            : (null, error);
    }

    public async Task<(AccountResponse? Account, AccountError? Error)> UpdateAsync(
        string id,
        UpdateAccountRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);

        var name = request.Name?.Trim();

        if (name is not { Length: > 0 and <= 40 })
        {
            return (null, AccountError.InvalidName);
        }

        var account = await database.Accounts
            .Include(account => account.LedgerEntries.Where(entry => entry.Source == LedgerEntrySource.Opening))
            .SingleOrDefaultAsync(account => account.Id == id, cancellationToken);

        if (account is null)
        {
            return (null, AccountError.NotFound);
        }

        account.Name = name;
        account.NormalizedName = name.ToUpperInvariant();

        var error = await SaveAsync(account, actor, "account_updated", cancellationToken);

        return error is null
            ? (Describe(account), null)
            : (null, error);
    }

    private async Task<AccountError?> SaveAsync(
        Account account,
        string actor,
        string action,
        CancellationToken cancellationToken)
    {
        database.AuditEvents.Add(new AuditEvent
        {
            ActorId = actor,
            SubjectId = account.Id,
            Action = action,
            OccurredAtUtc = DateTimeOffset.UtcNow
        });

        try
        {
            await database.SaveChangesAsync(cancellationToken);

            return null;
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqliteException { SqliteExtendedErrorCode: 2067 })
        {
            return AccountError.DuplicateName;
        }
    }

    private AccountResponse Describe(Account account) => new()
    {
        Id = account.Id,
        Name = account.Name,
        ImageUrl = account.ImageKey is { } key ? $"/api/accounts/{account.Id}/image?v={key}" : null,
        Currency = settings.Currency,
        Balance = account.BalanceMinorUnits is { } balance ? CurrencyAmount.Format(balance) : null,
        OpeningEntry = account.LedgerEntries.SingleOrDefault() is { } entry ? LedgerAdministration.Describe(entry, settings.Currency) : null
    };
}