namespace PocketMonkey.Api.Services;

public enum OpeningBalanceError
{
    InvalidAmount,
    InvalidComment,
    InvalidIdempotencyKey,
    NotFound,
    AlreadyInitialized,
    IdempotencyConflict
}