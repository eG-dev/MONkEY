using RuntimeChecks.Tests;

if (args is ["retention-fixture", var retentionPath, var retentionAccount])
{
    await LedgerPersistenceCheck.ConfigureRetentionFixtureAsync(retentionPath, retentionAccount);

    return;
}

if (args is ["allowance-fixture", var path, var accountId, var mode])
{
    await AllowanceExecutionCheck.ConfigureFixtureAsync(path, accountId, mode);

    return;
}

if (args is ["allowance-execution"])
{
    await AllowanceExecutionCheck.RunAsync();

    return;
}

if (args is ["allowance-persistence"])
{
    await AllowancePersistenceCheck.RunAsync();

    return;
}

if (args is ["image-persistence"])
{
    await ImagePersistenceCheck.RunAsync();

    return;
}

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