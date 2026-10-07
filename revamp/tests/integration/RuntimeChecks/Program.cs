using RuntimeChecks.Tests;

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