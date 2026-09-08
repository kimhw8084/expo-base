# Expo Base 1.0.0 — proposed release notes

_Draft for PM approval. These notes are not published and do not authorize a tag or release._

Expo Base is a universal Expo foundation for teams building production-oriented iOS, Android, tablet, and web applications. The release keeps product code semantic while shared Precision Calm packages own layout, responsiveness, themes, density, interaction, forms, overlays, navigation, feedback, data composition, motion, and runtime boundaries.

## What is included

- Shared light/dark theming, white-label brand accents, comfortable/compact density, adaptive layouts, and responsive navigation.
- Reusable buttons, fields, form compositions, cards, metrics, tables, lists, feedback states, overlays, action menus, and visualization primitives.
- Canonical keyboard and validation-focus behavior across web and native-oriented form contracts.
- Dialog, sheet, popover, toast, dismissal, focus-restoration, and safe-area-aware overlay ownership.
- Virtualized list and adaptive data workflows with loading, empty, error, refresh, sorting, selection, and bulk-action patterns.
- Shared async action ownership with single-flight repeated-tap protection, stale-response protection, retry states, and unmount-safe completion handling.
- Backend-neutral service, authentication, authorization, linking, and session-security boundaries with fail-closed client access behavior.
- A reference application that demonstrates the architecture through realistic workflows, component/system labs, stress content, and deterministic acceptance hooks.
- A new-app generator that emits the provider order, theme bootstrap, forms, navigation, linking, auth, authorization, session-security, and service adapter boundaries.
- Expo Base Doctor, architecture/style/API contracts, generated-app validation, and a production-like web certification harness.

## Certification included

- Runtime verification passes on the pinned Node 22 / Expo SDK 57 compatibility baseline.
- Expo Base Doctor reports 86 passed, 0 failed, and 0 warnings.
- Fresh static web export certification passes Chromium, Firefox, and WebKit: 180/180 tests.
- Web certification uses a fresh export, an OS-assigned loopback port, and deterministic server cleanup.

## Adoption notes

- Node.js `>=22.13.0` is required; Node 22 LTS is recommended.
- Native development uses an Expo development client. Expo Go is not the supported path for this template.
- Generated service, authentication, session-security, and linking adapters are replaceable demonstrations. They must be connected to product implementations before production use.
- Client-side authentication and authorization improve navigation and UX; product backends must independently enforce authorization and data access.

## Known limitations and outstanding validation

- Native runtime acceptance has not executed in the current environment. iOS simulator destination resolution was unavailable and iOS acceptance remains required before final release approval. Android runtime acceptance is explicitly deferred/waived for `1.0.0` under PM Policy B because the local Android runtime was unavailable.
- Physical-device review for safe areas, keyboard behavior, secure storage, deep links, and lifecycle behavior remains outstanding.
- The current static web export is approximately one 4.4 MB bundle. Route-level splitting remains an application-scale follow-up.
- Final license approval, release commit/tag, and publication decisions require owner approval.
