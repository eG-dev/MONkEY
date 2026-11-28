# POCKET MONkEY

![POCKET MONkEY logo](../design/assets/images/monkey_face.png)

POCKET MONkEY records children's pocket money and savings without holding or
transferring money. Track signed opening balances, deposits, withdrawals and
monthly allowances in one shared instance, in German or English.

Managers manage users and financial data. Members can read assigned active accounts;
accounts are shared resources, not private to individual members. Amounts use exact two-decimal arithmetic.
Currency is a display unit, not a currency-conversion service.

## For Users

- [Accounts and Transactions](users/Accounts-and-Transactions.md): shared accounts, opening balances, deposits, withdrawals, images and history.
- [Monthly Allowances](users/Monthly-Allowances.md): next-month settings, automatic credits, catch-up and failure status.
- [Users and Access](users/Users-and-Access.md): roles, user administration, passwords, sessions and personal preferences.

## For Operators

Install and look after a POCKET MONkEY instance:

- [Getting Started](operators/Getting-Started.md): install a published image and create the first Manager.
- [Configuration](operators/Configuration.md): environment variables, persistent storage and HTTPS.
- [Release Deployment Quick Reference](operators/Release-Deployment.md): short instructions for an extracted release bundle.
- [Backup, Restore and Upgrades](operators/Backup-Restore-and-Upgrades.md): complete backups, financial snapshots, upgrades and recovery.
- [Troubleshooting](operators/Troubleshooting.md): logs, readiness, HTTPS, access and storage diagnostics.
- [Release notes and deployment assets](https://github.com/eG-dev/MONkEY/releases): choose an exact published version.

## For Contributors

- [Development and Testing](contributors/Development-and-Testing.md): local setup, locked builds, real-image tests and failure diagnostics.
- [Translation Contributions](contributors/Translation-Contributions.md): catalog changes, language registration, completeness and layout review.
- [Technical guide](../development.md): detailed development, recovery and operational procedures.

## For Maintainers

- [Builds and Releases](maintainers/Builds-and-Releases.md): protected tags, candidate review, approval, same-artifact publication and failure handling.

## Scope and Limits

The published pre-releases are for acceptance testing, not a production-readiness
claim. The supported image platform is Linux amd64, with one application instance
and SQLite on local disk. Do not run multiple application replicas against the
same data directory.

There is no public registration, email recovery, tenancy or Azure data import.
HTTPS is required for production authentication. Use synthetic financial data
when evaluating a beta, and preserve full backups before upgrades.

The application bundles its runtime assets, translations, license and third-party
notices locally. See [the project license](../../LICENSE) and
[third-party notices](../../THIRD-PARTY-NOTICES.txt).

## Documentation Scope

These guides describe the maintained deployment contract. For an exact release,
use that release's digest-pinned deployment bundle and installation instructions.
Architecture decisions remain in the [repository ADRs](../ADR/README.md), and
unfinished acceptance work remains in the [finish-line plan](../../plans/migration/README.md).