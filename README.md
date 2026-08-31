# Expo Base

A constrained, adaptive Expo application platform for iOS, Android, tablet and web. Product code expresses semantic intent; the platform owns geometry, spacing, responsiveness, scrolling, overlays, theming, interaction states and quality enforcement.


## Run the reference template app

Prerequisite: Node.js 22.13+ and npm. This project uses native modules, so mobile testing uses a development build rather than Expo Go.

```bash
npm install
npx expo install --fix
npm run quality:gate36
npm run doctor -- --path apps/reference --fail
```

Web:

```bash
npm run reference:web
```

Then open the local URL printed by Expo.

Native first build:

```bash
npm exec -w @precision-calm/reference -- expo run:android
# macOS + Xcode only:
npm exec -w @precision-calm/reference -- expo run:ios
```

After the native development build is installed, normal JS/TS iteration uses:

```bash
npm run reference:start
```

## Current implementation

The workspace now includes:

- independent semantic light/dark themes and explicit white-label accent palettes
- comfortable/compact density scope that preserves interaction safety
- adaptive layout and action-overflow engines
- interaction primitives and curated icon facade
- form framework and optional React Hook Form adapter
- adaptive navigation with Expo Router isolated behind an adapter
- centralized overlays/dialogs/sheets/popovers
- virtualized list infrastructure
- adaptive tables, metrics and centralized numeric formatting
- line/area/bar/sparkline/progress visualization system
- loading/empty/error/offline/degraded feedback states
- reduced-motion, haptics and accessibility helpers
- 15 reusable golden page patterns
- `/system` component laboratory and `/stress` pathological-content route
- 252-scenario certification matrix and geometry validator
- Playwright web test specification and Maestro native reference flow
- new-app generator with independent product branding
- backend-neutral auth/data/storage/analytics/image adapter contracts with deterministic demo implementations
- stable `@precision-calm/ui` public facade and `@precision-calm/runtime` root provider
- single compatibility manifest with version-drift enforcement
- existing-app migration auditor with prioritized migration waves
- 62-check application doctor and public API snapshot protection
- typed root service injection so feature code consumes backend-neutral adapters
- centralized capability/entitlement authorization with fail-closed client guards and backend-neutral adapters

## Contract quality gate

```bash
npm run quality:gate36
```

This is the strongest gate on the restored development line that can execute without installed React Native/Expo dependencies. It includes deterministic and randomized contract tests across the core platform, authentication, linking, and capability authorization.

## Runtime certification

The current execution environment cannot reach the npm registry, so Level B runtime certification has not been claimed. In a networked environment:

```bash
npm install
npm run quality:gate36
npm run reference:prebuild
npm run reference:web
npm run test:web
```

Then execute `tests/native/reference-flow.yaml` on iOS and Android using Maestro.

Run `npm run readiness` for the machine-readable current certification state.

## Create a new app

```bash
npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet
```

The generated application consumes the shared packages; it does not copy/fork the design system.

See `docs/CERTIFICATION.md`, `docs/PUBLIC_API.md`, `docs/MIGRATION.md`, `docs/PORTABILITY.md`, `docs/BRANDING.md`, `docs/GENERATOR.md`, and `docs/REFERENCE.md`.


## Gate 34 — safe external navigation and deep-link policy

Outgoing URLs now pass through a default-deny policy and a replaceable Expo Linking adapter. Dangerous schemes are blocked, HTTPS hosts/custom schemes are explicit, non-default ports are denied unless configured, and sensitive query/fragment data can be redacted from diagnostics. Native incoming links are normalized through Expo Router `+native-intent` without throwing, with untrusted inputs routed to a branded safe-link error surface. Feature code is linted/audited against direct `expo-linking`, `Linking.openURL`, `window.open`, and `location.href` usage.


## Gate 35 — authentication session and protected-route orchestration

Authentication now has an explicit loading/signed-out/signed-in/error state model, a centralized React runtime over `AuthAdapter`, Expo Router `Stack.Protected` ownership through `ProtectedRouterStack`, safe signed-out/bootstrap/recovery routes, and a memory-only return-intent channel shared with validated Gate 34 native links. Protected UI is unavailable until session restoration resolves; raw provider errors are never shown to users; direct feature-level auth adapter/session routing is audited. Client route protection remains separate from backend authorization.


## Gate 36 — capability/entitlement authorization

Authentication and authorization are now separate runtime concerns. A backend-neutral `AuthorizationAdapter` resolves semantic capability keys for the authenticated identity; the runtime normalizes and refreshes them, prevents stale asynchronous results from overriding newer live policy, and fails closed while inactive/loading/error. Product UI consumes `usePrecisionAuthorizationRequirement` or `CapabilityGate`, while nested `ProtectedRouterStack` groups can make capability-specific routes unavailable. Hard-coded feature roles and direct authorization-adapter access are migration violations. These client guards improve UX/navigation only—backend APIs, storage, and databases must still independently enforce authorization.
