namespace PocketMonkey.Host.Services;

public enum LedgerError
{
    InvalidAmount,
    InvalidComment,
    InvalidIdempotencyKey,
    InvalidSource,
    NotFound,
    AccountRetired,
    AlreadyInitialized,
    NotInitialized,
    IdempotencyConflict,
    BalanceOverflow,
    InvalidPageSize,
    InvalidCursor,
    TransactionHistoryExpired,
    HistoryRetentionChanged
}