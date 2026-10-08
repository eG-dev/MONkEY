using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PocketMonkey.Api.Contracts.Accounts;
using PocketMonkey.Api.Entities;
using PocketMonkey.Api.Storage;

namespace PocketMonkey.Api.Services;

public sealed class AccountAdministration
{
    private readonly FoundationDbContext database;

    public AccountAdministration(FoundationDbContext database)
    {
        this.database = database ?? throw new ArgumentNullException(nameof(database));
    }

    public Task<List<AccountResponse>> ListAsync(CancellationToken cancellationToken) =>
        database.Accounts
            .AsNoTracking()
            .OrderBy(account => account.NormalizedName)
            .ThenBy(account => account.Id)
            .Select(account => new AccountResponse
            {
                Id = account.Id,
                Name = account.Name
            })
            .ToListAsync(cancellationToken);

    public Task<AccountResponse?> FindAsync(string id, CancellationToken cancellationToken) =>
        database.Accounts
            .AsNoTracking()
            .Where(account => account.Id == id)
            .Select(account => new AccountResponse
            {
                Id = account.Id,
                Name = account.Name
            })
            .SingleOrDefaultAsync(cancellationToken);

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

        var account = await database.Accounts.FindAsync([id], cancellationToken);

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

    private static AccountResponse Describe(Account account) => new()
    {
        Id = account.Id,
        Name = account.Name
    };
}