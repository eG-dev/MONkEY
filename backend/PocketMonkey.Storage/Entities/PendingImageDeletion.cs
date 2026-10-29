namespace PocketMonkey.Storage.Entities;

public sealed class PendingImageDeletion
{
    public required string ImageKey { get; init; }
}