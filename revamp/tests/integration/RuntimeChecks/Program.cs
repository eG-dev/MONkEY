using RuntimeChecks.Tests;

if (args is ["ledger-persistence"])
{
    await LedgerPersistenceCheck.RunAsync();

    return;
}

if (args is ["account-persistence"])
{
    await AccountPersistenceCheck.RunAsync();

    return;
}

if (args is ["identity-upgrade"])
{
    await IdentityUpgradeCheck.RunAsync();

    return;
}

if (args is ["expired-session"])
{
    SessionExpiryCheck.Run();

    return;
}

GlobalizationCheck.Run();