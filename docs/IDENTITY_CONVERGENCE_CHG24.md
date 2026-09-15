# CHG-24 identity convergence residual report

Status: candidate implementation on the assigned non-main branch. This report is the residual
occurrence classification for the exhaustive post-migration search. It is not a second product
identity or a replacement for the current Expo Base contract.

## Current contract

Current repository, workspace, package, API, generator, scaffolder, doctor, migration-audit,
configuration, example, and generated-app surfaces use **Expo Base / `expo-base`**. Private
workspace packages use `@expo-base/*`; current product/runtime symbols use `ExpoBase*`; and
tool, binary, config, and generated-file stems use `expo-base` (including
`create-expo-base-app`, `scaffold-expo-base-screen`, `expo-base-migrate-audit`,
`expo-base-doctor`, `expo-base.api.json`, `expo-base.compatibility.json`,
`expo-base.capabilities.json`, and `expo-base.routes.json`). No tracked filename retains a
legacy identity stem.

## Classification 2 — migration-only compatibility

These are the only live legacy API identifiers intentionally retained for the within-major root
API contract. They are explicitly deprecated, isolated from current implementation exports, and
not emitted by documentation, examples, or the generator:

- `packages/ui/src/legacy-compat.ts`: 33 former `Precision*`/`precision*` root-facade aliases,
  each mapped to its `ExpoBase*` implementation.
- `packages/runtime/src/legacy-compat.ts`: `PrecisionRuntimeProvider` and
  `PrecisionRuntimeProviderProps`, mapped to the current `ExpoBaseRuntimeProvider` types.
- `docs/PUBLIC_API.md` and `docs/MIGRATION.md`: migration instructions that name these aliases
  only to direct consumers to the current names.
- `scripts/test-migration-compatibility.mjs`: compatibility assertions and a guard that fresh
  generator output contains no legacy identity.

`npm run test:migration-compatibility` covers the alias isolation. Removal is a future major-version
migration decision; these names are not a parallel supported namespace.

## Classification 3 — historical/provenance evidence

The following artifacts preserve the identifiers that were true in the audited or release-note
baseline. Their companion prose and/or metadata now labels them as pre-CHG-24 historical evidence;
they are not current implementation or product guidance:

- `docs/GOLDEN_TEMPLATE_AUDIT.md` and `docs/golden-template-capabilities.json` preserve the
  historical package, symbol, path, and `precision.capabilities.json` references.
- `docs/GOLDEN_PRODUCT_QUALITY_AUDIT.md` and `docs/golden-product-quality-defects.json` preserve
  the historical owner/package references used by that audit.
- `docs/final-independent-product-quality-defects.json` preserves the historical owner references
  used by the independent quality re-audit.
- `docs/RUNTIME_RC2.md` preserves the provider name used by that historical release note.

The remaining audit/release companion artifacts are also historical where their metadata says so,
even when they contain no legacy identifier occurrence. Historical Git/release facts were not
rewritten as current claims.

## Non-identity wording

The ordinary domain word “precision” in internationalization guidance (for example, numeric
precision and min/max policy) is not a product or package identifier. It remains unchanged.

No other `Precision Calm`, `precision-calm`, `@precision-calm/*`, legacy `Precision*` API,
`create-precision-*`, `migrate-precision-*`, `precision-doctor`, or legacy precision config/file
stem remains in current live product code, current guidance, generator output, or tracked
filenames.
