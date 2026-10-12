# POCKET MONkEY Architecture Decisions

Read and follow applicable records before changing code, plans, or instructions.
Write new records using [ADR-0001](ADR-0001-architecture-decision-records.md).
Records describe agreed product decisions; unresolved proposals stay in the plans.

| Record | Decision |
| --- | --- |
| [ADR-0001](ADR-0001-architecture-decision-records.md) | Concise greenfield decision records |
| [ADR-0002](ADR-0002-application-boundaries.md) | Angular/Web-BFF and .NET ownership boundaries |
| [ADR-0003](ADR-0003-shared-instance-access.md) | Shared accounts and local Manager/Member access |
| [ADR-0004](ADR-0004-language-and-timezone.md) | Extensible German/English UI and separate business timezone |
| [ADR-0005](ADR-0005-e2e-first-verification.md) | E2E-first application verification |
| [ADR-0006](ADR-0006-github-delivery.md) | GitHub Actions verification, GitHub Releases, and public GHCR images |
| [ADR-0007](ADR-0007-application-foundation.md) | Evaluated runtime, SQLite, supervised image, localization, and verification tooling |
| [ADR-0008](ADR-0008-local-authentication.md) | Local Identity, cookie sessions, antiforgery, operator recovery, and role enforcement |
| [ADR-0009](ADR-0009-shared-accounts.md) | Shared account identity, unique trimmed names, Manager writes, and atomic audit |
| [ADR-0010](ADR-0010-ledger-and-money.md) | Exact two-decimal minor units, explicit opening entries, atomic posting, and idempotency |
| [ADR-0011](ADR-0011-currency-display-unit.md) | Instance-wide EUR/USD display unit, unchanged exact arithmetic, and suffix symbols |
| [ADR-0012](ADR-0012-manual-transactions-and-signed-balances.md) | Signed openings and overdrafts, positive manual inputs, atomic deltas, and snapshot-bounded history |
| [ADR-0013](ADR-0013-wireframes-and-click-prototypes.md) | View-only rough wireframes first, then detailed offline click prototypes on a shared shell |
| [ADR-0014](ADR-0014-private-account-images.md) | Bounded private images, canonical PNG encoding, and immutable-file recovery |
| [ADR-0015](ADR-0015-monthly-allowance-configuration.md) | Next-month allowance revisions, exact amounts, Manager configuration, and no credits on save |
| [ADR-0016](ADR-0016-monthly-allowance-execution.md) | Historical monthly catch-up, disabled-period skipping, retry-safe credits, and timezone-change scheduling |
