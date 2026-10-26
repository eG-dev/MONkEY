# Users and Access

POCKET MONkEY uses local usernames and passwords for one shared instance. There
is no public registration or email recovery. Managers create users and administer
access; each user manages their own password and personal preferences.

## Understand the Roles

| Action | Manager | Member |
| --- | --- | --- |
| Read every account, image, balance and retained history | Yes | Yes |
| Create or rename accounts and change their images | Yes | No |
| Post openings, deposits and withdrawals | Yes | No |
| Configure monthly allowances | Yes | No |
| View allowance configuration and credit status | Yes | Yes |
| View allowance attempt details and failure reasons | Yes | No |
| Create users, edit access or reset another user's password | Yes | No |
| Change own password, language and theme | Yes | Yes |

Users are not assigned to individual accounts. An account named after a child is
still visible to all signed-in Managers and Members. Personal preferences do not
grant permission to change financial data.

The backend enforces permissions, not just the visible controls. A Member cannot
gain write access by opening a Manager page or sending a request directly.

## Sign In

Use the instance's configured HTTPS address and your username and password.
You can select German or English before signing in. If your password is temporary,
complete the required password change before accessing accounts or administration.

Sessions have an eight-hour absolute lifetime, without sliding renewal or a
remember-me option. Signing out ends the current browser session. Do not assume
that restarting the application signs everyone out: valid sessions can survive a
restart when the persistent authentication keys are retained.

Five failed password attempts lock an account for fifteen minutes. Sign-in also
has an instance-wide rate limit of twenty attempts per minute. Stop repeated
attempts and allow the relevant limit to clear. Authentication errors are generic
rather than a way to discover which usernames exist.

For HTTPS, cookie or access problems, see [Troubleshooting](Troubleshooting.md).

## Create a User

The first Manager is created by the operator during
[Getting Started](Getting-Started.md). After that, a Manager can create users in
the application:

1. Open user administration and choose the create-user action.
2. Enter a username and display name. Both are required, trimmed and limited to
   100 characters. Usernames must be unique ignoring case.
3. Choose Member or Manager. Member is the initial selection; grant Manager only
   when the person should administer users and write financial data.
4. Create the user. The application generates and displays a temporary password.
5. Deliver the username and temporary password privately to the intended person,
   then close the password dialog.

The temporary password is not available to reveal again after closing the dialog.
If it is lost, reset the password rather than creating another user. Do not put
credentials in screenshots, public issues, shared logs or chat transcripts. A
copied password also remains subject to your device's clipboard handling.

At first sign-in, the new user enters the temporary password as their current
password and chooses a new password. They must complete this step before ordinary
protected access.

## Edit Access or Disable a User

In user administration, choose the pencil for the intended user. You can change
their display name, role and active status. The username is not editable in this
dialog. Review the intended person and save.

Saving a user edit revokes that user's existing sessions on their next request,
including when only the display name changes. Role changes therefore take effect
without waiting for the eight-hour session expiry. Editing your own user can
return you to sign-in.

Disabling prevents access; it does not delete the user or their financial history.
Users retain immutable internal identities, and previously posted entries retain
their actor provenance. There is no user-deletion workflow.

The last active Manager cannot be disabled or changed to Member. The backend
enforces this even if Managers save concurrent changes. Establish another active
Manager before removing the last one's administrative access; do not bypass the
protection by editing SQLite.

## Reset a Forgotten Password

A Manager can use the key action beside another user, confirm the reset and
privately deliver the newly generated temporary password. Resetting revokes the
user's existing sessions and requires them to choose a new password at sign-in.
The temporary password is shown only in the result dialog, not retrievable later.

Use your profile's password-change action for your own password when you know it.
If no Manager can sign in, the operator must use
[Manager recovery](Backup-Restore-and-Upgrades.md#recover-manager-access).
There is no emailed reset link or public recovery bypass.

Operator recovery is different from in-app administration. It targets an existing
Manager, resets their password, clears lockout, reactivates them and requires a
password change. Bootstrap is only for an installation with no users; it is not
a way to add another Manager to an existing installation. Host access is a
privileged operator capability, not something the Manager role itself grants.

Follow the linked interactive procedure against the intended persistent data
directory. Enter passwords directly at its hidden terminal prompts, never as
command arguments or in chat. Do not recreate the instance or delete its volume
to resolve a forgotten password.

## Change Your Own Password

1. Open your profile and choose the password-change action.
2. Enter your current password, then the new password and its confirmation.
3. Submit the change and sign in again with the new password.

Passwords must contain 12-256 characters, including uppercase and lowercase
letters and a digit. Use a unique password and a password manager. A failed
confirmation does not change the password.

A successful change revokes existing sessions, including the current one. If you
do not know the current password, ask a Manager for a reset instead.

## Personal Preferences

Your profile shows your display name, username and role, and lets you choose
German or English and switch dark mode. Signed-in preferences are saved for your
user; they do not change another user's preferences or permissions. Use Manager
administration, not the profile, to change a display name or role.

Language changes presentation and number formatting, not stored amounts, the
instance currency or business month boundaries. The operator configures currency
and business timezone separately through [Configuration](Configuration.md).

See [Accounts and Transactions](Accounts-and-Transactions.md) and
[Monthly Allowances](Monthly-Allowances.md) for the financial workflows. The
authoritative access rules are recorded in
[shared-instance access](../ADR/ADR-0003-shared-instance-access.md) and
[local authentication](../ADR/ADR-0008-local-authentication.md).