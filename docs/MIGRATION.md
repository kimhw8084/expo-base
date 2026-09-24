# Existing-app migration

Expo Base migrations should be executed as vertical slices, but only after auditing the existing codebase for platform violations and dependency drift.

CHG-24 identity migration: current workspaces use the private `@expo-base/*` scope, `ExpoBase*`
symbols, and `expo-base` tool/config stems. The former `Precision*` root facade symbols are
deprecated aliases only; update imports and names to Expo Base in migrated code. The aliases are
isolated from the generator and current examples so a migration cannot accidentally establish a
second supported namespace. Exact v1.0 application-facing package specifiers remain available as
private migration-only forwarding shims during 1.x; see [PUBLIC_API.md](./PUBLIC_API.md) for the
allowlisted paths and their canonical replacements. They are planned for removal in 2.0.0.

## Audit

```bash
npm run migrate:audit -- --path /path/to/existing-app
npm run migrate:audit -- --path /path/to/existing-app --json
```

The auditor groups findings into four waves:

1. **Foundation replacement** — raw geometry, StyleSheet ownership, responsive branching, scroll ownership, dependency alignment.
2. **Interaction centralization** — router coupling, overlays, icons, animation, haptics.
3. **Data presentation** — centralized numeric/locale formatting and adaptive data views.
4. **Service decoupling** — direct backend SDK usage in feature UI moves behind adapters.

High-severity findings should be addressed before broad visual migration because they represent architecture that can undermine responsive or interaction consistency.

## Recommended vertical-slice migration

For each feature:

1. Preserve product behavior and data contracts.
2. Replace route shell/layout with Expo Base primitives/patterns.
3. Move forms, lists, overlays and navigation to platform APIs.
4. Move service calls behind adapters if they currently live in UI modules.
5. Run contract gates and runtime certification.
6. Delete the replaced legacy UI instead of maintaining duplicate systems.

The audit CLI is diagnostic by default. CI can use `--fail-on high` to prevent new high-severity migration debt during an incremental conversion.

## Non-destructive source upgrade plan

`migrate:audit` finds architecture and dependency drift in product code. `migrate:upgrade-plan`
compares a generated consumer with a newer Expo Base source checkout using exact source provenance,
file ownership evidence, and three-way source hashes. Package-version strings alone never establish
upgrade authority.

Run the planner from the target Expo Base checkout, or pass that checkout explicitly:

```bash
npm run migrate:upgrade-plan -- --path /path/to/independent-product --json
npm run migrate:upgrade-plan -- --path /path/to/independent-product --source-root /path/to/newer/expo-base
npm run migrate:upgrade-plan -- --path /path/to/independent-product --output /tmp/product-upgrade-plan.md
```

The consumer must retain a valid `.expo-base/source.json`. The planner resolves the recorded source
commit and tree in the target checkout and verifies both identities before comparing files. Its
default is read-only: it does not apply changes, regenerate files, install dependencies, or edit
consumer source or lockfiles. An explicit `--output` creates only a new report file and refuses to
overwrite an existing file. Review the hashes, ownership evidence, and dependency alignment before
planning any actual edits.

The exact historical 1.0 generator at commit `43ae1b27257697093d893d504b7e22b6f25cfad7` predates
the `sourceTree` field. For that legacy shape, the planner confirms the exact historical generator
does not emit `sourceTree`, then resolves the recorded commit and derives its Git tree from that
immutable commit object. A missing tree fails closed for any generator that does emit it. Whenever
`sourceTree` is recorded, it must match the resolved tree or planning fails closed.

Consumers generated before `.expo-base/generated-files.json` use a conservative fallback. It can
prove direct vendored `@expo-base/*` source and known copied platform tooling from exact historical
Git bytes. Root files without generation-time ownership evidence stay manual or product-preserved;
the fallback does not infer replaceability from file names or version strings. Optional capabilities
are never added by a dependency plan, and selected capabilities plus 1.x API compatibility shims
remain product decisions.

New standalone output records governed paths, SHA-256 generation-time hashes, source origins, and
one of `platform-owned`, `platform-generated`, or `product-seed`. The manifest does not duplicate
source identity and excludes itself from its file list. Product seeds such as routes, services,
domain data, integrations, and branding are always preserved for product-led review.

The report is planning evidence, not an updater. After reviewing it, a later AI-assisted migration
must make the actual manual changes in the consumer repository, preserve product routes/domain
behavior/copy, and rerun that product's verification and acceptance checks. Never regenerate over an
owned product repository.
