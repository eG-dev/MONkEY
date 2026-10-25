using System.Security.Claims;
using PocketMonkey.Host.Contracts.Accounts;
using PocketMonkey.Storage.Entities;
using PocketMonkey.Host.Identity;
using PocketMonkey.Host.Services;

namespace PocketMonkey.Host.Endpoints;

public static class TransactionEndpoints
{
    public static void MapTransactions(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        var transactions = app.MapGroup("/api/accounts/{id}/transactions")
            .RequireAuthorization("ReadyUser")
            .WithTags("Transactions");

        transactions.MapGet("", async Task<IResult> (
            string id,
            int? pageSize,
            string? cursor,
            LedgerAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var result = await administration.HistoryAsync(id, pageSize ?? 20, cursor, cancellationToken);

                return result.Error is { } error ? ToResult(error) : TypedResults.Ok(result.History);
            })
            .WithName("AccountHistory")
            .WithSummary("Read account ledger history")
            .WithDescription("Ready Managers and Members read snapshot-bounded history, including openings. Page size defaults to 20 and is limited to 1-100.")
            .Produces<LedgerHistoryResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);

        transactions.MapPost("", async Task<IResult> (
            string id,
            TransactionRequest request,
            ClaimsPrincipal principal,
            LedgerAdministration administration,
            CancellationToken cancellationToken) =>
            {
                var result = await administration.PostTransactionAsync(
                    id, request, principal.FindFirstValue(ClaimTypes.NameIdentifier)!, cancellationToken);

                return result.Error is { } error ? ToResult(error) : TypedResults.Ok(result.Entry);
            })
            .RequireAuthorization(UserRole.Manager.ToIdentityName())
            .WithName("PostTransaction")
            .WithSummary("Post a deposit or withdrawal")
            .WithDescription("Managers submit a positive decimal-string amount after explicit initialization. Matching retries return the original entry. Overdrafts are allowed; overflow and conflicting keys are rejected atomically.")
            .Produces<LedgerEntryResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict);
    }

    private static IResult ToResult(LedgerError error) => error switch
    {
        LedgerError.InvalidAmount => Failure("invalid_transaction_amount", StatusCodes.Status400BadRequest),

        LedgerError.InvalidSource => Failure("invalid_transaction_source", StatusCodes.Status400BadRequest),

        LedgerError.InvalidComment => Failure("invalid_comment", StatusCodes.Status400BadRequest),

        LedgerError.InvalidIdempotencyKey => Failure("invalid_idempotency_key", StatusCodes.Status400BadRequest),

        LedgerError.NotFound => Failure("not_found", StatusCodes.Status404NotFound),

        LedgerError.NotInitialized => Failure("not_initialized", StatusCodes.Status409Conflict),

        LedgerError.IdempotencyConflict => Failure("idempotency_conflict", StatusCodes.Status409Conflict),

        LedgerError.BalanceOverflow => Failure("balance_overflow", StatusCodes.Status409Conflict),

        LedgerError.InvalidPageSize => Failure("invalid_page_size", StatusCodes.Status400BadRequest),

        LedgerError.InvalidCursor => Failure("invalid_history_cursor", StatusCodes.Status400BadRequest),

        LedgerError.TransactionHistoryExpired => Failure("transaction_history_expired", StatusCodes.Status409Conflict),

        LedgerError.HistoryRetentionChanged => Failure("history_retention_changed", StatusCodes.Status409Conflict),

        _ => throw new ArgumentOutOfRangeException(nameof(error), error, "Unsupported transaction error.")
    };

    private static IResult Failure(string code, int status) => TypedResults.Json(new { code }, statusCode: status);
}