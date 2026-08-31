# Public application API

Precision Calm separates its stable application-facing API from implementation package topology.

## Feature code

Product screens should import visual components, layouts, patterns, accessibility helpers, and motion helpers from:

```ts
import { Button, Page, TextField, DashboardLayout } from '@precision-calm/ui';
```

Feature routes must not import presentation implementation packages such as `@precision-calm/components` or `@precision-calm/layouts` directly. `scripts/check-public-api.mjs` enforces this across every `apps/*/app` tree.

## Application root

Mount one runtime boundary:

```tsx
import { PrecisionRuntimeProvider } from '@precision-calm/runtime';
```

It owns replaceable keyboard, motion, overlay, and density integrations. Applications do not need to know which third-party packages implement those capabilities.

## Explicit non-UI boundaries

These remain intentionally separate because they represent configuration or integration concerns rather than visual composition:

- `@precision-calm/tokens` — brand/theme build configuration
- `@precision-calm/platform` — pure contracts/formatters where explicitly needed
- `@precision-calm/navigation-router` — Expo Router adapter
- `@precision-calm/form-rhf` — React Hook Form adapter
- `@precision-calm/adapters` — backend/service contracts

## Compatibility manifest

`precision.compatibility.json` is the single source of truth for pinned Expo, React Native, React, styling, animation, SVG, form, and test-tool versions. `scripts/check-package-manifests.mjs` rejects drift between workspace manifests and this file.

This boundary is deliberate: internal packages may be split, combined, or replaced later without forcing product feature code to rewrite imports.
