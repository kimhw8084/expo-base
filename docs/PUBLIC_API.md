# Public application API

Expo Base separates its stable application-facing API from implementation package topology.

## Feature code

Product screens should import visual components, layouts, patterns, accessibility helpers, and motion helpers from:

```ts
import { Button, Page, TextField, DashboardLayout } from '@expo-base/ui';
```

Feature routes must not import presentation implementation packages such as `@expo-base/components` or `@expo-base/layouts` directly. `scripts/check-public-api.mjs` enforces this across every `apps/*/app` tree.

## Application root

Mount one runtime boundary:

```tsx
import { ExpoBaseRuntimeProvider } from '@expo-base/runtime';
```

It owns replaceable keyboard, motion, overlay, and density integrations. Applications do not need to know which third-party packages implement those capabilities.

## Migration compatibility

Current code, documentation, examples, and generated apps use only `@expo-base/*` package paths
and `ExpoBase*` symbols. During the 1.x line, private, deprecated forwarding workspaces preserve
the exact v1.0 application-facing package paths below. They contain no implementation and are not
a second current namespace; migrate new code to the canonical path on the right. They are planned
for removal at the first future major-version boundary (`2.0.0`).

| v1.0 package path | Canonical 1.x path | Application-facing v1 evidence |
| --- | --- | --- |
| `@precision-calm/ui` | `@expo-base/ui` | Stable feature facade |
| `@precision-calm/runtime` | `@expo-base/runtime` | Stable application root |
| `@precision-calm/tokens` | `@expo-base/tokens` | Public brand/theme configuration boundary |
| `@precision-calm/platform` | `@expo-base/platform` | Public pure contracts/formatters boundary |
| `@precision-calm/navigation-router` | `@expo-base/navigation-router` | Public Expo Router adapter |
| `@precision-calm/form-rhf` | `@expo-base/form-rhf` | Public React Hook Form adapter and scaffolder output |
| `@precision-calm/adapters` | `@expo-base/adapters` | Public backend-neutral service contracts |
| `@precision-calm/server-state` | `@expo-base/server-state` | Public query/cache/mutation boundary |
| `@precision-calm/auth` | `@expo-base/auth` | Generator and reference application root composition |
| `@precision-calm/authorization` | `@expo-base/authorization` | Generator/reference authorization composition |
| `@precision-calm/capabilities` | `@expo-base/capabilities` | Public optional-capability registration |
| `@precision-calm/linking` | `@expo-base/linking` | Generator/reference linking composition |
| `@precision-calm/linking-expo` | `@expo-base/linking-expo` | Generator/reference Expo linking bridge |
| `@precision-calm/session-security` | `@expo-base/session-security` | Generator/reference session-lock adapter |
| `@precision-calm/secure-storage` | `@expo-base/secure-storage` | Documented optional capability |
| `@precision-calm/preferences` | `@expo-base/preferences` | Documented optional capability and scaffolder output |
| `@precision-calm/runtime-capabilities` | `@expo-base/runtime-capabilities` | Documented optional capability and generator output |
| `@precision-calm/sharing` | `@expo-base/sharing` | Documented optional capability root |
| `@precision-calm/sharing/runtime` | `@expo-base/sharing/runtime` | Documented bootstrap-safe entry point and generator output |
| `@precision-calm/sharing/ui` | `@expo-base/sharing/ui` | Documented capability-backed UI entry point |
| `@precision-calm/media` | `@expo-base/media` | Documented optional capability and scaffolder output |
| `@precision-calm/local-auth` | `@expo-base/local-auth` | Documented optional capability |
| `@precision-calm/notifications` | `@expo-base/notifications` | Documented optional capability |
| `@precision-calm/updates` | `@expo-base/updates` | Documented optional capability |
| `@precision-calm/device` | `@expo-base/device` | Documented optional capability |
| `@precision-calm/haptics` | `@expo-base/haptics` | Documented optional capability |
| `@precision-calm/observability` | `@expo-base/observability` | Documented optional capability |
| `@precision-calm/visualization-advanced` | `@expo-base/visualization-advanced` | Documented opt-in Golden Module |

The `@expo-base/ui` facade keeps the former `Precision*` root symbols as explicitly deprecated,
migration-only aliases in `packages/ui/src/legacy-compat.ts`. `@expo-base/runtime` keeps the
former `PrecisionRuntimeProvider` root alias for the same reason. `npm run
test:migration-compatibility` resolves every listed package path, type-checks representative old
and canonical imports, and verifies fresh generator output contains no legacy identity.

## Explicit non-UI boundaries

These remain intentionally separate because they represent configuration or integration concerns rather than visual composition:

- `@expo-base/tokens` — brand/theme build configuration
- `@expo-base/platform` — pure contracts/formatters where explicitly needed
- `@expo-base/navigation-router` — Expo Router adapter
- `@expo-base/form-rhf` — React Hook Form adapter
- `@expo-base/adapters` — backend/service contracts
- `@expo-base/server-state` — scoped query keys, cache lifecycle, mutations, and feedback mapping
- optional capability packages — root registration uses headless/runtime entry points; capability-backed UI such as copy presentation uses the documented UI subpath

## Compatibility manifest

`expo-base.compatibility.json` is the single source of truth for pinned Expo, React Native, React, styling, animation, SVG, form, and test-tool versions. `scripts/check-package-manifests.mjs` rejects drift between workspace manifests and this file.

This boundary is deliberate: internal packages may be split, combined, or replaced later without forcing product feature code to rewrite imports.
