namespace PocketMonkey.Host.Contracts.Users;

public sealed record MemberAccountAssignmentsResponse
{
    public required IReadOnlyList<string> AccountIds { get; init; }
}