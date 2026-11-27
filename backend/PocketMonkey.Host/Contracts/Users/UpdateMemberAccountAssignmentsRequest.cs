namespace PocketMonkey.Host.Contracts.Users;

public sealed record UpdateMemberAccountAssignmentsRequest
{
    public string?[]? AccountIds { get; init; }
}