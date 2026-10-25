# Step 3D: Private Account Images

Status: implemented and locally verified under
[ADR-0014](../../docs/ADR/ADR-0014-private-account-images.md).

## Implemented Scope

- Managers upload/replace/remove; both roles read through authenticated routes with private-cache behavior. No public static image directory.
- PNG/JPEG/WebP inputs, maximum 512 pixels per axis and 2 MiB. Validate decoded content and re-encode through SkiaSharp without unnecessary metadata; no resizing/cropping feature.
- Generated immutable filenames, traversal protection, file-before-database publication and atomic reference/audit changes. Failed replacements retain the old image.
- Grace-period orphan cleanup recovers interrupted writes/removals without racing active uploads.
- Accessible localized controls, fallback states and responsive display; no browser-only image work during SSR.

## Acceptance Gate

- [x] Real API/browser coverage verifies valid upload/replacement/removal, restart persistence and Member read-only access.
- [x] Anonymous/CSRF, oversized/spoofed/invalid/traversal and decoded-dimension cases fail safely.
- [x] SQLite/filesystem probes cover audit rollback, write failures, referenced-file preservation and repeatable orphan cleanup.
- [x] Image readiness, fallback and desktop/mobile layout are checked; German/English catalogs cover messages.

No further image feature is required for the first release. Application-wide
visual and actual-host storage acceptance remain in the [finish-line plan](README.md).