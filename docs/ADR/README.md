# POCKET MONkEY Architecture Decisions

Read and follow applicable records before changing code, plans, or instructions.
Maintain one authoritative record per coherent topic using
[ADR-0001](ADR-0001-architecture-decision-records.md). Update that record for
approved changes; add another for a distinct topic, not just a revised decision.
References mean the current decision; use a commit-specific reference for earlier
wording.
Records describe agreed product decisions; unresolved proposals stay in the plans.

| Record                                                          | Decision                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [ADR-0001](ADR-0001-architecture-decision-records.md)           | Authoritative topic records, explicit change approval, and concise history                              |
| [ADR-0002](ADR-0002-application-boundaries.md)                  | Angular/Web-BFF and .NET ownership boundaries                                                           |
| [ADR-0003](ADR-0003-shared-instance-access.md)                  | Shared instance, Manager administration and assigned-active-account Member reads                          |
| [ADR-0004](ADR-0004-language-and-timezone.md)                   | Extensible German/English UI and separate business timezone                                             |
| [ADR-0005](ADR-0005-e2e-first-verification.md)                  | E2E-first application verification                                                                      |
| [ADR-0006](ADR-0006-github-delivery.md)                         | GitHub Actions verification, GitHub Releases, and public GHCR images                                    |
| [ADR-0007](ADR-0007-application-foundation.md)                  | Runtime, SQLite, persistent state, and deployment                                                       |
| [ADR-0008](ADR-0008-local-authentication.md)                    | Local Identity, cookie sessions, antiforgery, operator recovery, and role enforcement                   |
| [ADR-0009](ADR-0009-shared-accounts.md)                         | Shared account identity, assigned reads and assignment removal on retirement/deletion                    |
| [ADR-0010](ADR-0010-ledger-and-money.md)                        | Exact two-decimal minor units, explicit opening entries, atomic posting, and idempotency                |
| [ADR-0011](ADR-0011-currency-display-unit.md)                   | Instance-wide EUR/USD display unit, unchanged exact arithmetic, and suffix symbols                      |
| [ADR-0012](ADR-0012-manual-transactions-and-signed-balances.md) | Signed balances, atomic postings, snapshot-bounded history, retention and account-deletion exceptions   |
| [ADR-0013](ADR-0013-wireframes-and-click-prototypes.md)         | View-only rough wireframes by review value, then detailed offline click prototypes on a shared shell    |
| [ADR-0014](ADR-0014-private-account-images.md)                  | Account-scoped private images, canonical PNG encoding and immutable-file recovery                        |
| [ADR-0015](ADR-0015-monthly-allowance-configuration.md)         | Next-month allowance revisions, preserved retirement settings, exact amounts, and Manager configuration  |
| [ADR-0016](ADR-0016-monthly-allowance-execution.md)             | Historical catch-up, retry-safe credits, reactivation choices, and account/month identities             |
| [ADR-0017](ADR-0017-backend-project-boundaries.md)              | Host executable, Storage library, one-way dependency, and EF ownership                                  |
| [ADR-0018](ADR-0018-project-license.md)                         | AGPLv3-only, commercial-use permissions, source-sharing obligations, and separate operator information  |
| [ADR-0019](ADR-0019-build-identity-and-about-assets.md)         | One application version, validated build/source identity, and generated local project-license assets    |
| [ADR-0020](ADR-0020-shipped-component-inventory.md)             | GitHub dependency reporting, targeted review, curated About entries, and preserved distribution notices |
| [ADR-0021](ADR-0021-portable-financial-recovery.md)             | Portable financial recovery and fail-closed incompatible prerelease snapshots                           |
