# Accounts and Transactions

POCKET MONkEY records pocket money; it does not hold money, connect to a bank or
transfer funds. A deposit or withdrawal records a change you want to track.

All accounts belong to the shared instance. Managers and Members can read every
account, balance, image and retained transaction. Naming an account after someone
does not make it private or give that person write access.

## What Each Role Can Do

| Action | Manager | Member |
| --- | --- | --- |
| View all accounts and retained history | Yes | Yes |
| Create or rename an account | Yes | No |
| Set an opening balance | Yes, once per account | No |
| Record deposits and withdrawals | Yes, after opening | No |
| Upload, replace or remove an account image | Yes | No |

Sign in and complete any required password change before using accounts. See
[Getting Started](Getting-Started.md) for the first Manager and
[Troubleshooting](Troubleshooting.md#access-is-locked-or-a-password-must-change)
for access problems.

## Create or Rename an Account

1. As a Manager, open the account overview and choose the create-account action.
2. Enter a name and save it. Names are trimmed, must contain 1-40 characters, and
   must be unique ignoring case. For example, `Alex` and `alex` conflict.
3. Open the new account to set its opening balance or change its image.

An account starts without a balance, not with an implicit zero. Creating or
renaming it does not post money. To rename an existing account, use the pencil
beside its name in account details. Its identity and financial history stay the
same. Account names are your own text and do not change with the UI language.

There is no account limit. There is also no account-deletion action; do not
remove database rows to simulate one.

## Set the Opening Balance

An opening is the account's starting position when you begin recording it here.
It may be positive, zero or negative. Explicit zero means the account is
initialized with no money; a negative opening means it starts owing money.

1. Open an uninitialized account as a Manager.
2. Enter the signed opening amount and, optionally, a comment of up to 500
   characters explaining the starting position.
3. Submit it, review the account and amount in the confirmation dialog, and confirm.
4. Check the displayed balance and opening entry in history.

Only one opening is allowed. It records who posted it, when it was posted and any
comment. You cannot edit or delete it, and there is no editable balance field.
Manual transactions become available only after the opening has been posted.

## Record a Deposit or Withdrawal

1. Open an initialized account and choose the record-transaction action.
2. Select deposit or withdrawal.
3. Enter a strictly positive amount. The selected type determines the direction;
   do not enter a negative amount for a withdrawal.
4. Add an optional comment of up to 500 characters, then submit.
5. Check the new balance and newest history entry.

A deposit increases the balance; a withdrawal decreases it. Withdrawals may take
the account below zero: there is no insufficient-funds restriction. For example,
an opening of `10.00`, a deposit of `5.00` and a withdrawal of `18.00` leave a
balance of `-3.00` in the configured currency.

Amounts have at most two decimal places. Extra precision is rejected, not rounded.
Representation limits and balance overflow are also rejected. A failed posting
must not leave a partial balance change or partial financial entry.

Posted entries are immutable. There is no edit, delete or dedicated reversal
action. If a recording mistake needs an offsetting deposit or withdrawal, first
check the original entry and use a clear comment; the original remains in history.
Never rewrite the stored balance to hide an error.

### If a Submission Appears to Fail

A lost response does not establish that a posting failed. The browser retains a
retry identity for the same pending account, transaction type, amount and comment.
Retrying that unchanged pending request returns its original retained entry
instead of posting twice. Changing the details creates a different request.

This is not general duplicate detection: a newly entered transaction, another tab
or a reloaded page can have a new identity. Do not repeatedly recreate a payment
because a response was unclear. Check the current balance and newest history
before entering another transaction. If you cannot establish the outcome, stop
and investigate rather than guess.

Opening submissions have the same matching-retry protection and the additional
one-opening constraint. If another Manager initializes the account first, refresh
and inspect that opening instead of trying to overwrite it.

## Read the History

Account details show newest entries first, including the opening and retained
manual transactions or automatic allowance credits. Entries show their signed
amount, type, comment or allowance month, posting actor and timestamp. Automatic
allowances are identified as automatic rather than a signed-in user's posting.

Use the previous/next controls for older entries. Browsing starts from a bounded
snapshot: new postings do not shift later pages while you read. Refresh the
account to start a new snapshot and see newly posted entries. If retention removes
entries during browsing, the application restarts the history once rather than
continuing from an invalid page.

Posting instants are stored in UTC and displayed in the configured business
timezone. Changing UI language changes formatting, not posting times or amounts.

### Why Older Entries May Be Missing

Transaction-detail retention defaults to 24 months. The operator can configure
1-120 months or `0` for unlimited history using
`MONKEY_TRANSACTION_RETENTION_MONTHS`; see [Configuration](Configuration.md).

Automatic cleanup runs at startup and daily. Its boundary is the first day of the
current UTC month minus the configured number of calendar months. Only strictly
older eligible transaction details are removed; this is not a rolling count of
days and does not use the business timezone.

The opening and exact current balance remain, along with financial audit and
duplicate-posting protection. Consequently, adding the opening to the remaining
visible entries may no longer reproduce the balance. Missing expired details do
not mean that their financial effects were reversed. Increasing retention later
does not restore details already removed.

Retention is not a backup and does not promise erasure of audits or historical
backups. An expired transaction's retry identity cannot be reused to post again.
For recovery options, see [Backup, Restore and Upgrades](Backup-Restore-and-Upgrades.md).

## Change an Account Image

As a Manager, select the account image in details to open its dialog. Choose a
file, review the preview and save. To remove an image, choose removal in the
dialog and save; cancel leaves the saved image unchanged.

- Supported formats are PNG, JPEG and WebP, with no animated content.
- Files must be at most 2 MiB (2,097,152 bytes), and neither dimension may exceed
  512 pixels. Resize larger images before uploading; the application does not
  crop or resize them for you.
- The server validates actual content and stores a fresh PNG without source
  metadata. A rejected replacement leaves the previous saved image intact.
- Images require authentication, but are visible to every signed-in Manager and
  Member. They are not private to a named account holder.

Without an available image, the account uses its name's first letter. Image changes
do not change balances or history. Complete backups must preserve the database
and image files together; financial JSON snapshots do not include these images.

## Currency and Display

The instance uses either `EUR` or `USD` for every account. Language and currency
are separate: changing German/English formatting does not convert money. The
currency symbol follows the amount, with cents omitted for whole amounts and two
fractional digits otherwise.

Changing the configured currency only relabels existing values; it does not
perform an exchange-rate conversion. Ask the operator before changing that
setting on an instance with recorded money.

For deployment or access errors, use [Troubleshooting](Troubleshooting.md). The
authoritative technical rules are recorded in the
[account](../ADR/ADR-0009-shared-accounts.md),
[money and history](../ADR/ADR-0012-manual-transactions-and-signed-balances.md),
[currency](../ADR/ADR-0011-currency-display-unit.md) and
[image](../ADR/ADR-0014-private-account-images.md) decisions.