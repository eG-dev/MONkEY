# ORT Preparation

[ADR-0020](../../docs/ADR/ADR-0020-shipped-component-inventory.md) selects the OSS
Review Toolkit (ORT) for the dependency/license overview. The previous bespoke
inventory and notice-review baseline are superseded. This is preparation, not a
completed ORT installation or a release compliance review.

## Implementation Checklist

- Evaluate and pin an ORT distribution and its prerequisites. Record a tested,
  reproducible invocation here before adding CI automation. Do not use an
  unpinned image or introduce a mandatory scan into normal application builds.
- Analyze the replacement web and backend projects, including resolved npm and
  NuGet transitives. Exclude legacy Azure projects from the replacement report;
  preserve dependency relationships across the replacement backend projects.
- Produce a readable report with package identity, exact version, dependency
  relationships, declared/detected licenses and unresolved findings. Keep raw
  results reproducible and generated, not manually maintained. Verify missing or
  unknown licenses remain visible, including on otherwise issue-free packages.
- Review build-only versus redistributed dependencies against actual outputs.
  Explicitly account for native/embedded code, Node/.NET runtimes, OS packages,
  fonts and copied assets. Do not claim that package-manager analysis finds all
  these automatically. Record supplemental coverage and remaining gaps.
- Keep review decisions and manually collected original license, copyright and
  NOTICE files separate from generated reports. Associate them with exact
  package identities/versions and upstream provenance. Establish the local
  mapping format after inspecting real ORT output; do not build another parser
  or competing inventory. Automated download/scanning is optional.
- Evaluate ORT reporting/notice output before choosing how to assemble the
  canonical distribution document. Review required text, copyright, NOTICE,
  compatibility and source/source-offer/relinking duties. A scan is not approval.

## Retained Delivery

The root [THIRD-PARTY-NOTICES.txt](../../THIRD-PARTY-NOTICES.txt) remains the
canonical distribution document, beside the project license. The existing About
preparation helper copies its exact bytes into ignored build inputs and generated
assets. Angular serves it at `/licenses/THIRD-PARTY-NOTICES.txt` in the tested
image; runtime retrieval from external services is not required. Generated copies
must not be edited. Preserve upstream runtime and OS notices supplied in the
image. Project-license generation and build/source metadata are independent of
ORT and remain unchanged.

Replace the temporary document only with reviewed, release-matched material,
bundle it before image verification, and publish only the tested artifact.
Incomplete notices and unresolved source obligations remain publication blockers.
About's illustrative component rows are not an ORT report or a completed review.

## Preserved Provenance

- N09, 2026-10-18: User confirmed: "the images were created by me". Treat project
  artwork/logo/favicon as first-party provenance. This does not select a separate
  asset license or establish a legal name; attribution/license coverage still
  needs documenting. Do not ask for the same authorship confirmation again.

No ORT version, successful scan, complete coverage or license approval is claimed
yet. Detailed collection/review and About integration remain deferred until
release preparation; this change selects and prepares the replacement approach.