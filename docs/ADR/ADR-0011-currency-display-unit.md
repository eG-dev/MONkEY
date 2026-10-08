# ADR-0011 Currency Display Unit

_Creation date_: 2026-10-08

## Context

POCKET MONkEY supports Euro and US Dollar as display units. Both use the same
two-decimal exact arithmetic. Selecting a unit must not convert amounts or
rewrite ledger history, and changing presentation language must not select it.

## Decision

- Configure one instance-wide display currency through `MONKEY_CURRENCY`, accepting `EUR` (default) or `USD`. Reject unsupported values before readiness.
- Currency is a display unit only. Changing it relabels existing amounts without conversion, balance changes, new entries, or rewritten posting provenance. Do not persist per-account currencies or exchange rates.
- Keep the two-decimal signed 64-bit minor-unit representation, canonical decimal-string API, validation, and atomic/idempotent posting rules from [ADR-0010](ADR-0010-ledger-and-money.md).
- Return the configured currency code with account and opening-entry responses. Format the number using the selected UI locale, preserving exact precision, and append the symbol (`€` or `$`) after the amount in every language.
- Use currency-neutral names for money parsing and formatting components.

This supersedes only the EUR-only and currency-immutability policy in
[ADR-0010](ADR-0010-ledger-and-money.md); its other decisions remain unchanged.