# Step 3B: Ledger and Opening Balances

Status: implemented and locally verified. Follow
[ADR-0010](../../docs/ADR/ADR-0010-ledger-and-money.md),
[ADR-0011](../../docs/ADR/ADR-0011-currency-display-unit.md) and the signed-money
policy in [ADR-0012](../../docs/ADR/ADR-0012-manual-transactions-and-signed-balances.md).

## Implemented Scope

- Explicit single Manager opening entry, including zero or negative amounts; no implicit initialization or generic editable balance.
- Exact signed 64-bit minor units internally, decimal-string APIs, two decimal places, checked arithmetic and rejected extra precision.
- Atomic ledger/balance/audit writes, unique idempotency keys, safe retry/conflict behavior and immutable actor/time/source provenance.
- Instance-wide EUR/default or USD display unit; localized suffix symbols without currency conversion or financial rewrites.

## Acceptance Gate

- [x] Both roles read exact persisted balances; direct Member/anonymous openings and CSRF attempts fail.
- [x] Concurrent/repeated openings never duplicate initialization; signed limits, invalid precision and failure rollback are covered in real SQLite/API checks.
- [x] Browser workflows cover opening validation, uninitialized state, responsive display and unchanged financial values across presentation changes.
- [x] Restart, historical actor attribution and private SSR behavior remain covered.

Manual transactions and allowances are implemented, not deferred. Opening entries
cannot be edited/repeated; dedicated reversals remain a separately approved future
feature. See [testing](testing.md) and the [finish-line plan](README.md).