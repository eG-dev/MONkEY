# Step 3D: account images

Status: not started. Depends only on [shared accounts](03a-accounts.md);
this step may be delivered before financial steps if money decisions remain open.
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).

## Outcome

Managers upload, replace, and remove account images. Both roles view them through
authenticated application routes; files remain private on persistent storage.

## Decisions before implementation

- Agree accepted formats, encoded size/dimension limits, and any cropping requirement; evaluate suitable libraries before choosing them.
- Define failure recovery and orphan cleanup when database and filesystem changes cannot commit together.

## Work

- Validate actual image content, re-encode uploads, and remove unnecessary metadata in the backend.
- Use safely generated filenames and path-traversal prevention; never trust supplied filenames or serve the private directory as public static content.
- Add authorized upload/read/delete contracts and appropriate private-cache behavior through the BFF.
- Build accessible manager upload/replacement/removal controls and member-visible images, with German/English validation and failure states.
- Keep cropping or other browser-only interactions out of SSR. Verify local image loading, fallback states, and responsive layout.
- Implement the agreed orphan cleanup and interrupted-operation recovery without altering financial history.

## Acceptance gate

- [ ] Valid upload/replacement/removal survives reload/restart and leaves the account/image reference consistent.
- [ ] Members can read but cannot write; anonymous reads/writes and CSRF attempts fail.
- [ ] Oversized, invalid, spoofed, and traversal attempts fail safely through direct API requests.
- [ ] Real-stack tests cover browser behavior and file/database failure recovery without leaking private files.

Next in the default order: [allowance configuration](03e-allowance-configuration.md).