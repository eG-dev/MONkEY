# Monthly Allowances

A monthly allowance automatically credits an account according to its saved
configuration. It records money in POCKET MONkEY; it does not transfer funds.
Managers configure allowances and can read all accounts' settings and credit status.
Members can read these details for their assigned active accounts.

## Configure an Allowance

First [create an account and post its opening balance](Accounts-and-Transactions.md#set-the-opening-balance).
An explicit zero or negative opening is valid too. Allowance configuration is
unavailable while the account is uninitialized.

1. Open account details as a Manager and find the monthly allowance panel.
2. Open its settings and turn the allowance on.
3. Enter a positive amount with at most two decimal places, in the instance's
   configured currency. Zero, negative amounts and extra precision are rejected.
4. Check the effective month shown in the dialog, then save.
5. Check the scheduled configuration in the account panel.

Saving does not credit the balance. Enabling, changing the amount and disabling
always take effect from the **next business month**, determined by the configured
business timezone `TZ`. You cannot choose a past effective month or edit the
configuration for the current month retroactively.

The panel distinguishes the current configuration from a scheduled change. A
successful save confirms the settings were recorded, not that an allowance ran.

## Change or Disable an Allowance

Use the same settings dialog to change the amount, or turn the allowance off and
save. Disabling retains the last configured amount for reference; it does not
change the balance, remove past credits or cancel already due months.

Several saves before the next month may replace what is scheduled for that
month. The latest saved revision for that effective month applies; earlier
revisions remain recorded. If another Manager changes the configuration while
your dialog is open, a stale save is rejected rather than silently overwriting
their change. Reopen the account details and review the latest settings before
trying again.

### Example

Assume these saves all occur in the configured business timezone:

| Action | Result |
| --- | --- |
| Enable `10.00` on August 12 | First eligible month is September; no August credit |
| Change it to `12.00` on August 20 | September uses `12.00`, not two separate credits |
| Change it to `15.00` on September 10 | September remains `12.00`; October uses `15.00` |
| Disable it on October 8 | October remains eligible for `15.00`; November and later months are disabled |

These are accounting months, not the day-of-month on which you saved. If the
application is offline at a due boundary, eligible credits catch up when it runs
again.

## When Credits Run

Credits become due on the first day of each month at `00:00` in business `TZ`.
The backend scans at startup and once per minute, so the due time is not a promise
of execution at the exact second. No browser tab or signed-in user is needed.
The application and its persistent storage must be available to execute credits.

Each credit records its business month and actual posting time. A late credit is
posted when processed, not backdated to make it appear the application ran while
offline. Account history identifies the allowance month and marks the posting as
automatic.

The credit, resulting balance, audit and credited execution outcome commit
together. A durable account/month identity prevents the same month being credited
twice during retries or interruption recovery. This protection survives restarts
and removal of expired transaction details.

## Catch-Up After Downtime

The application processes every missed eligible month, oldest first, using that
month's historical configuration. It does not apply today's amount to all missed
months. Months with no effective configuration or a disabled configuration are
skipped; enabling later does not make those months eligible retroactively.

For example, if September was configured for `12.00` and October for `15.00`, an
instance that resumes in October can post both amounts for their respective
months. Disabling from November does not erase September or October obligations.

If one month fails, later months for that account wait. Other accounts can
continue processing. Interrupted or failed work is retried automatically; there
is no manual run-now step required for normal recovery.

Do not post an extra manual deposit just because an automatic credit is delayed.
That manual transaction does not mark the allowance month as credited, and the
automatic retry may still succeed later. Check status and history first.

## Read Credit Status

The allowance panel shows the latest successful credit and, where applicable,
its catch-up month. It also shows an outstanding pending or failed month. Reopen
account details to retrieve fresh status; a saved settings message is not an
execution-status check.

| Display | Meaning and next step |
| --- | --- |
| No credits yet | No successful execution is recorded. Check the first effective month and whether it is due. |
| Latest credit | The displayed execution succeeded. Check its month and the corresponding history entry rather than assuming it covers every outstanding month. |
| Pending month | Work is outstanding. Allow the scanner to run, then check again. |
| Failed month | An attempt failed and will be retried. Managers can inspect the attempt count, last attempt and reported reason. |

Members can read credit status and history, but attempt details and failure
reasons are restricted to Managers. A load-error retry button retries reading the
panel; it does not manually post an allowance.

### If a Month Keeps Failing

A balance-range failure means the credit would exceed the supported exact-money
range. Retrying without resolving the underlying condition will not make it fit.
A storage failure needs operator investigation of logs, disk availability and
permissions. Follow [Troubleshooting](Troubleshooting.md), preserving data and
keeping private records out of public reports.

Changing next month's settings does not rewrite a failed historical month's
selected configuration. Do not delete execution records, edit ledger rows or
reset a month to force another attempt. Automatic retry must retain the original
month's duplicate-credit protection.

## Timezone, Currency and Retention

The operator configures business `TZ`; changing UI language does not change when
months become due. After a timezone change, the new zone determines outstanding
work. Already credited months, selected revisions and posting instants remain
unchanged: shifting a UTC month boundary does not authorize another credit.

The allowance uses the same exact two-decimal money and instance-wide `EUR` or
`USD` display unit as manual transactions. Changing the currency setting relabels
amounts; it does not convert them. See [Configuration](Configuration.md) before
making operator-level changes.

Transaction retention can remove an old allowance's ledger details, but its
credited month and configuration records remain. An expired history entry is not
a missing credit and will not be posted again. See
[history retention](Accounts-and-Transactions.md#why-older-entries-may-be-missing)
and [Backup, Restore and Upgrades](Backup-Restore-and-Upgrades.md) for the separate
retention and recovery rules.

The authoritative technical decisions are
[allowance configuration](../ADR/ADR-0015-monthly-allowance-configuration.md) and
[allowance execution](../ADR/ADR-0016-monthly-allowance-execution.md).