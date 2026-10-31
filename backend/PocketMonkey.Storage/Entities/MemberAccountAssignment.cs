namespace PocketMonkey.Storage.Entities;

public sealed class MemberAccountAssignment
{
    public required string UserId { get; init; }

    public required string AccountId { get; init; }
}