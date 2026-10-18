# ADR-0020 ORT-Assisted Third-Party Notices

_Creation date_: 2026-10-18

_Updated_: 2026-10-18

_Consolidated_: ADR-0021 merged into this record by explicit approval on
2026-10-18. The earlier automated approach is retained under Alternatives.

## Context

Recipients need the license, copyright and NOTICE material required for software
and assets redistributed with POCKET MONkEY. Direct dependency manifests and image
scans alone do not establish that scope: browser/server bundles, transitive and
native dependencies, copied assets and runtime/OS components all matter.
Automated identification provides evidence but cannot decide attribution,
compatibility, rights or source obligations. Mandatory archive reconciliation on
every build adds maintenance without replacing that review. External package
links alone do not satisfy obligations requiring accompanying material or offline
access.

## Decision

- Use the OSS Review Toolkit (ORT) for dependency and license analysis and a reviewable overview, including direct and transitive npm/NuGet dependencies. Do not maintain a competing bespoke inventory or archive-reconciliation implementation. Evaluate and pin the ORT version and invocation against the replacement projects before requiring it in CI; hosting, configuration and reporting details remain implementation work.
- Maintain required distribution texts in the canonical root [THIRD-PARTY-NOTICES.txt](../../THIRD-PARTY-NOTICES.txt), beside the project license. The document is a distribution output, not the authoritative hand-maintained dependency inventory. Original notices may be collected manually and associated with exact package identities/versions; ORT downloading, scanning and notice generation are optional capabilities to evaluate, not prerequisites for adoption.
- Review ORT's coverage against redistributed browser/server packages and transitives, backend/native dependencies, fonts/artwork, and container/runtime software. Record gaps and supplement the overview where necessary; package-manager analysis alone does not prove complete redistribution coverage. Distinguish actual delivery from build-only tools and metadata-only dependencies. Include redistributed native payloads regardless of execution platform; their presence does not establish platform support.
- Preserve required component-specific copyright and attribution notices. Shared identical license texts may appear once with explicit component associations. Retain applicable NOTICE material; package/source links supplement rather than replace local text.
- Copy the canonical document byte-for-byte through the existing build-input snapshot and ignored generated-assets path; check freshness alongside the project license. Bundle it through normal application assets before testing the image so it accompanies the tested artifact and is readable without external networking. Keep only the root document maintained in source control. Do not download notices at runtime or introduce consent state, backend endpoints or a separate compliance engine.
- Review the list and notice document when shipped dependencies/assets/runtime inputs change and before each release. Include operating-system changes even when mutable package repositories change without a source edit. Record reviewed inputs, findings and unresolved items. Resolve attribution, compatibility choices, rights and applicable source/source-offer/relinking obligations explicitly; notices do not satisfy every license obligation by themselves.
- Use ORT reports, package/build metadata and targeted initial/release audits to assist the review. Keep analysis separate from ordinary application builds until its reproducible invocation and coverage are verified. Do not require bespoke NuGet archive parsing, emitted-byte inventory, full-image scanning/reconciliation, or their parser dependencies in every development/CI build. Preserve upstream runtime and OS notices already supplied in the image. Do not modify or rebuild the tested artifact for publication.
- Keep incomplete material explicitly marked as draft. Ordinary development builds may use it, but publication requires complete reviewed notices, applicable source delivery and the independent release gates. Successful generation, copying or scanning is not legal approval.

This refines [build identity and About assets](ADR-0019-build-identity-and-about-assets.md)
and [GitHub delivery](ADR-0006-github-delivery.md), without changing application
identity or project-license generation. Operational review guidance is maintained
in the [build guide](../../revamp/README.md#third-party-notices).

## Alternatives

- Manifest-based npm tooling can retain development-only packages and cannot prove which bundled or copied material ships.
- Image-only scanning misses bundled npm identities and NuGet notice material. Requiring a DLL for each NuGet identity also loses native and metadata-only packages.
- Mandatory hybrid collection combining Angular emitted-byte statistics, locked NuGet archive/publish verification and a digest-pinned final-image scan was evaluated. It provides stronger input evidence but adds parser dependencies, binary reconciliation and image-export complexity without replacing human notice/source review. Prefer optional initial/release audits over this machinery in every build.
- External package/source links alone do not retain required local license, copyright or NOTICE material.
- Hosted SCA services were considered. ORT was selected explicitly; automated retrieval of original notice files is not a selection requirement.

## Change History

- 2026-10-18: Selected ORT by explicit user approval to provide the dependency/license overview, replacing the bespoke inventory and review baseline. Manual original-notice collection remains acceptable; application build identity, exact notice delivery and release obligations are unchanged.