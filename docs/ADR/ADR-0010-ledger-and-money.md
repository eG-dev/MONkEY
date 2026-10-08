# ADR-0010 Ledger and Money

_Creation date_: 2026-10-08

## Context

POCKET MONkEY must represent money exactly across SQLite, .NET, JSON, and the
browser. Initial balances must have explicit provenance and remain safe when a
request is retried or submitted concurrently. Account administration must not
silently create or overwrite financial history.

## Decision

The original fixed, immutable currency policy was replaced by configurable display
units in [ADR-0011](ADR-0011-currency-display-unit.md). This record describes the
current ledger contract; the other exact-money decisions are unchanged.

- Use one configurable display currency for the instance, independently of UI language and business timezone, following [ADR-0011](ADR-0011-currency-display-unit.md). Changing it only relabels amounts; it does not convert money or rewrite ledger history.
- Persist and calculate money as signed 64-bit integer cents. Reject negative amounts/balances, values outside that representation, and arithmetic overflow. There is no additional product-specific monetary cap.
- Exchange monetary values as decimal strings, not JSON numbers. Return canonical two-decimal strings. Reject input with more than two decimal places rather than silently rounding; never calculate money with binary floating-point.
- New accounts, including accounts without ledger history, are uninitialized until a Manager explicitly posts one opening entry. Zero is a valid explicit opening amount, not an implicit default balance.
- An account can have exactly one opening entry. Do not edit it, post a second opening entry, or expose an editable balance. Corrections require a separately agreed append-only posting policy.
- Commit the ledger entry, stored balance, and audit event atomically. Record immutable account/actor IDs, the actor display snapshot, UTC posting time, source, and an optional comment.
- Enforce unique idempotency keys in persistence. A retry of the same authorized request returns the original entry without additional effects; reusing a key with a different account, actor, amount, or comment is a conflict. Concurrent initialization must not duplicate entries.
- Managers post opening entries; ready authenticated Managers and Members read exact balances and opening provenance. Backend authorization and antiforgery remain authoritative.

Related: [application boundaries](ADR-0002-application-boundaries.md),
[shared accounts](ADR-0009-shared-accounts.md), and
[language/timezone separation](ADR-0004-language-and-timezone.md).