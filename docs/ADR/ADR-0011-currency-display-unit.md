# ADR-0011 Currency Display Unit

_Creation date_: 2026-10-08
_Updated_: 2026-10-24

## Context

POCKET MONkEY supports Euro and US Dollar as display units. Both use the same
two-decimal exact arithmetic. Selecting a unit must not convert amounts or
rewrite ledger history, and changing presentation language must not select it.

## Decision

- Configure one instance-wide display currency through `MONKEY_CURRENCY`, accepting `EUR` (default) or `USD`. Reject unsupported values before readiness.
- Currency is a display unit only. Changing it relabels existing amounts without conversion, balance changes, new entries, or rewritten posting provenance. Do not persist per-account currencies or exchange rates.
- Keep the two-decimal signed 64-bit minor-unit representation, canonical decimal-string API, validation, and atomic/idempotent posting rules from [ADR-0010](ADR-0010-ledger-and-money.md).
- Return the configured currency code with account and opening-entry responses. Format the number using the selected UI locale, preserving exact precision, and append the symbol (`€` or `$`) after the amount in every language.
- Omit the fractional part only when cents are zero; otherwise display exactly two fractional digits. Apply this equally to EUR and USD without changing canonical API strings, editable input values or stored precision.
- Use currency-neutral names for money parsing and formatting components.
- Run core E2E workflows with EUR, not a duplicated EUR/USD matrix. Verify USD through one focused desktop configuration/rendering check and targeted persistence checks that changing the display unit preserves exact amounts and posting history. Retain unsupported-currency startup validation.

This supersedes only the EUR-only and currency-immutability policy in
[ADR-0010](ADR-0010-ledger-and-money.md); its other decisions remain unchanged.

## Change History

- 2026-10-24: Approved Currency Formatting R1 hides zero cents for whole amounts
  while retaining two digits for nonzero cents, reducing visual noise without
  changing exact money or input contracts.