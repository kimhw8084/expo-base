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

The `@expo-base/ui` facade keeps the former `Precision*` root symbols as explicitly deprecated,
migration-only aliases in `packages/ui/src/legacy-compat.ts`. `@expo-base/runtime` keeps the
former `PrecisionRuntimeProvider` root alias for the same reason. New code, documentation,
examples, and generated apps use only the `ExpoBase*` names; these aliases are not a parallel
current namespace and are covered by `npm run test:migration-compatibility`.

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
