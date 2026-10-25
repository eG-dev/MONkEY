# Financial Scenario Exports

Synthetic format-version-1 JSON, shared by real-image E2E, SQLite integration
checks and manual testing. No household data, credentials or images are included.
All scenarios use EUR, `TZ=UTC`, transaction retention 24 months and a reference
capture time of 2026-06-15T12:00:00Z. IDs are stable and historical attribution
does not create login users.

| Scenario | Expected imported state |
| --- | --- |
| `uninitialized` | One account named Uninitialized, no balance or ledger entries. |
| `signed-balances` | Positive 12.50 (opening 10.00, deposit 5.00, withdrawal 2.50), Negative -5.00, Zero 0.00; five ledger entries total. |
| `retained-history` | One account with stored balance 100.00, permanent opening 10.00 and 25 retained deposits of 1.00; two retired keys, sequence high-water 50, retention revision 1. Remaining entries deliberately do not sum to the balance. |
| `allowance-recovery` | One account 12.50, opening 10.00 and credited June 2026 allowance 2.50. July execution is pending; configuration disables allowance from August 2026. |

Manual startup uses real time, not the reference clock. For `allowance-recovery`,
July catch-up raises the balance to 15.00 once; later months remain disabled.
Future retention can prune eligible transaction details but never openings,
stored balances or durable allowance/key records. Use the other scenarios for
time-stable exploration within the documented retention window. Never change
dates silently to make a historical scenario look current.

## Manual Use

Build the image from the repository root:

```text
npm --prefix web run build:image
npm --prefix tests/e2e run scenario -- signed-balances
```

The loader prints its dynamically assigned loopback URL and the path to private,
ignored login details under `.local/financial-scenarios/manual/`. Open that
file locally for the disposable Manager credentials; do not put them in reports.
Secure production cookies require HTTPS for signed-in manual browser testing;
provide a local HTTPS reverse proxy for the printed loopback origin. E2E uses
the existing isolated HTTPS fixture automatically.

Switch scenarios explicitly:

```text
npm --prefix tests/e2e run scenario -- retained-history --reset
```

`--reset` stops and discards only the loader-owned disposable instance, including
its users, images and authentication keys, before re-import and user bootstrap.
Without that flag existing storage is rejected. Use `--name another-test` to keep
separate instances. The loader rejects unknown scenarios, arbitrary storage
paths, links, unowned volumes and unrelated containers using its volume. It is
test tooling outside the production image; production import has no reset flag.
Remove only the exact test container/volume printed by the loader when done.
Exports/fixtures are mounted read-only during import and are never reset.

## Validation and Regeneration

From ``:

```text
dotnet run --project tests/integration/RuntimeChecks --configuration Release -- financial-recovery tests/fixtures/financial-snapshots
dotnet run --project tests/integration/RuntimeChecks --configuration Release -- financial-fixtures tests/fixtures/financial-snapshots
```

The first command validates the actual committed files through production
validation/import and real SQLite. The second mechanically regenerates the
synthetic exports from `FinancialScenarioFixtures`; review JSON changes and
update this catalog together. E2E imports `signed-balances` and verifies browser
reads, Manager posting, Member denial and explicit reset on desktop/mobile:

```text
npm --prefix tests/e2e test -- specs/recovery/ --workers=1
```

Malformed fixtures stay in negative test code, not this usable scenario catalog.