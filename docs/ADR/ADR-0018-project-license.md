# ADR-0018 Project License

_Creation date_: 2026-10-17

## Context

POCKET MONkEY is an open-source, self-hosted household application. Its license
should preserve recipients' software freedoms and require source availability for
covered derivatives, including modified versions offered over a network, rather
than prohibit commercial activity or require individual commercial permission.

## Decision

- License original project software under the GNU Affero General Public License, version 3 only, SPDX identifier `AGPL-3.0-only`. Do not automatically grant future license versions.
- Keep the unmodified standard license text in the repository-root [LICENSE](../../LICENSE) and identify the license in the [README](../../README.md#license). Preserve applicable copyright and license notices; third-party dependencies and separately licensed assets retain their own terms.
- Permit commercial use subject to AGPL obligations. Do not add a commercial-use prohibition or permission requirement that conflicts with the standard license.
- Provide Corresponding Source for distributed covered works and the source offer required by section 13 for modified network versions. Release artifacts must retain the license, applicable notices, and a source reference matching the distributed revision. A source link to an unrelated or newer revision is not a substitute.
- Keep hosting, updates, backups, and recovery responsibilities in separate self-hosted operator information, consistent with the license. Apply its warranty and liability disclaimers subject to mandatory law; do not promise enforceability or remove recipients' license rights through application terms.
- Verify rights to license contributed/project material and third-party compatibility before publication. Do not infer contributor relicensing rights, a contributor agreement, or copyright ownership from the license choice alone.

## Alternatives

- MIT and Apache-2.0 permit proprietary derivatives without the selected copyleft obligations.
- GPLv3 has distribution copyleft but lacks AGPL's modified-network-version source offer.
- A commercial-use restriction would require a different, non-open-source licensing approach; source-sharing under AGPL is preferred instead.

This complements [GitHub delivery](ADR-0006-github-delivery.md).