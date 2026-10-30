# ADR-0014 Private Account Images

_Creation date_: 2026-10-10
_Updated_: 2026-10-30

## Context

Account images must remain private, accept bounded untrusted input, and survive
interruption without leaving database references to unfinished files. SQLite
and the filesystem cannot share a transaction.

## Decision

- Managers upload, replace, and remove images. Ready authenticated Managers
  may read active and retired account images through the Web-BFF; Members may
  read only images of their assigned active accounts under
  [ADR-0003](ADR-0003-shared-instance-access.md) and
  [ADR-0009](ADR-0009-shared-accounts.md). Apply the account-access check in the
  backend before reading/serving the file, including direct API and SSR requests.
  Inaccessible and nonexistent account IDs use the same `404`/`not_found`
  response. Assignment revocation or account retirement denies subsequent
  Member image requests, even with an existing session.
- Enforce roles and antiforgery in the backend and use no-store responses.
  Never expose the image directory as static content or treat possession of an
  image URL/key as authorization. Previously delivered images cannot be recalled.
- Accept PNG, JPEG, and WebP up to 2,097,152 bytes and 512 pixels on either axis.
  Reject oversized, malformed, unsupported, and animated content. No cropping
  or resizing is included. Declared content type must match decoded format.
- Use MIT-licensed SkiaSharp with its Linux NoDependencies native assets.
  Decode bounded pixels and encode fresh PNGs without source metadata.
- Create immutable PNG files using generated keys, finish and flush the file
  before committing the account reference and audit event atomically. No
  filesystem operations occur inside database transactions. Failure leaves the
  previous reference intact; retries may create harmless unreferenced files.
- Removal clears the reference atomically. Replaced, removed, and interrupted
  upload files are reclaimed only when unreferenced and older than 24 hours,
  with cleanup at startup and hourly. Restrict cleanup to generated image names;
  do not remove unrelated operator files. Interrupted cleanup is retry-safe.
- Historical financial entries are unaffected. Backups include both the
  database and private image directory.

## Alternatives

- ImageSharp offers managed decoding but uses a split license with additional
  commercial-use conditions. SkiaSharp's MIT license is simpler for a shared
  public self-hosted application; Linux native deployment is verified in the
  production image.
- Deleting previous files immediately complicates interrupted-operation and
  concurrent-read recovery; grace-period collection avoids that coupling.

## Change History

- 2026-10-30: Aligned image reads with assigned-active-account Member access and Manager retired-account access; backend checks apply to direct URLs and SSR without changing image storage or cleanup rules.