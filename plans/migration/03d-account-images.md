# Step 3D: account images

Status: locally implemented and verified on 2026-10-10. Depends only on [shared accounts](03a-accounts.md);
this step may be delivered before financial steps if money decisions remain open.
Apply the [milestone delivery and verification rules](03-ui-business-logic.md).
The user approved the design references and implemented representative design on
2026-10-10; the [step 2B design pause](02b-ux-ui-design.md) is lifted. This is the
completed slice. The user agreed the image limits, formats, and recovery approach
on 2026-10-10; [ADR-0014](../../docs/ADR/ADR-0014-private-account-images.md)
records the evaluated SkiaSharp implementation and recovery policy.

## Outcome

Managers upload, replace, and remove account images. Both roles view them through
authenticated application routes; files remain private on persistent storage.

## Agreed decisions

- Accepted uploads: PNG, JPEG, and WebP, at most 512 pixels on each axis and
	2,097,152 bytes (2 MiB). Reject larger images; do not resize or crop in this
	slice. Validate decoded content and re-encode without unnecessary metadata.
- Write immutable files with generated names before atomically committing the
	database reference. Failed replacement retains the old reference/image.
	Clean up unreferenced files after a grace period to recover interrupted writes
	and removals without racing active uploads.
- Use MIT-licensed SkiaSharp with Linux native assets, as evaluated in ADR-0014.

## Work

- Validate actual image content, re-encode uploads, and remove unnecessary metadata in the backend.
- Use safely generated filenames and path-traversal prevention; never trust supplied filenames or serve the private directory as public static content.
- Add authorized upload/read/delete contracts and appropriate private-cache behavior through the BFF.
- Build accessible manager upload/replacement/removal controls and member-visible images, with German/English validation and failure states.
- Keep cropping or other browser-only interactions out of SSR. Verify local image loading, fallback states, and responsive layout.
- Implement the agreed orphan cleanup and interrupted-operation recovery without altering financial history.

## Acceptance gate

- [x] Valid upload/replacement/removal survives reload/restart and leaves the account/image reference consistent.
- [x] Members can read but cannot write; anonymous reads/writes and CSRF attempts fail.
- [x] Oversized, invalid, spoofed, and traversal attempts fail safely through direct API requests.
- [x] Real-stack tests cover browser behavior and file/database failure recovery without leaking private files.

## Verification record

The production Linux image built successfully. All six image checks passed with
one worker and no retries: API validation/access/restart, the real SQLite and
filesystem recovery probe, and German/English desktop/mobile workflows.
The eight neighboring account checks also passed, with the exact response-contract
case rerun after adding its expected nullable `imageUrl` field.

API checks include exact 2 MiB acceptance, limit-plus-one and 8 MiB rejection,
both 513-pixel axes, unsupported/spoofed content, metadata stripping, private
no-store reads, CSRF, traversal, and Manager/Member/anonymous access. Oversized
input is discarded without retaining it before returning 413, avoiding unread
request-body resets through the Web-BFF. Recovery checks cover audit rollback,
filesystem failure, referenced-file retention, and repeatable orphan cleanup.
Desktop/mobile dialog screenshots were reviewed without overlap. The prototype
limit hint passed English/German, light/dark, and 360px/1440px checks without
horizontal overflow; its text-only refinement remains draft pending review.
No application-wide or hosted CI acceptance is claimed.

Next in the default order: [allowance configuration](03e-allowance-configuration.md).