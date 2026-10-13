namespace PocketMonkey.Host.Services;

public enum LedgerError
{
    InvalidAmount,
    InvalidComment,
    InvalidIdempotencyKey,
    InvalidSource,
    NotFound,
    AlreadyInitialized,
    NotInitialized,
    IdempotencyConflict,
    BalanceOverflow,
    InvalidPageSize,
    InvalidCursor
}