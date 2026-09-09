# Expo Base

Expo Base is a production-oriented universal Expo foundation built around the Precision Calm design system. Shared packages own tokens, layout, interaction, forms, navigation, overlays, feedback, data composition, motion, server state, and runtime services so product routes stay semantic and portable.

## Prerequisites

- Node.js `>=22.13.0` (Node 22 LTS recommended)
- npm
- An Expo development client for native work; Expo Go is not supported

## Install and verify

```bash
npm install
npm run runtime:verify
npm run runtime:test:web
```

`runtime:test:web` creates a fresh static export, serves it on an isolated loopback port, runs the Chromium, Firefox, and WebKit certification projects, and cleans up the server on every exit path.

## Run the reference app

```bash
npm run reference:web
```

The reference app is the canonical showcase for adaptive navigation, forms, overlays, data workflows, scoped server state, async interactions, authentication, authorization, linking, and session security.

## Generate an application

```bash
npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet
```

Generated applications inherit the provider order, deterministic web theme bootstrap, native theme synchronization, UI facade, forms, session-security architecture, and scoped server-state owner with deterministic key helpers. Replace the demo adapters in `services.ts`, `auth.ts`, `sessionSecurity.ts`, and `linking.ts` with product implementations before production use.

## Architecture

- `packages/tokens` and `packages/platform` — design tokens and platform behavior
- `packages/ui` — shared UI facade and reusable compositions
- `packages/runtime` — bootstrap, async actions, auth, authorization, and session services
- `packages/server-state` — query identity, scoped cache, mutations, invalidation, and stale-safe feedback mapping
- `apps/reference` — canonical reference implementation and certification surface
- `docs/RELEASE_READINESS.md` — development, validation, and release gates

The platform also includes backend-neutral linking, service, authorization, migration, and Doctor packages. Client authentication and authorization improve navigation and UX only; product backends must enforce their own access policy.

See [docs/CERTIFICATION.md](docs/CERTIFICATION.md), [docs/GENERATOR.md](docs/GENERATOR.md), [docs/PUBLIC_API.md](docs/PUBLIC_API.md), [docs/SERVER_STATE.md](docs/SERVER_STATE.md), [docs/MIGRATION.md](docs/MIGRATION.md), [docs/PORTABILITY.md](docs/PORTABILITY.md), and [docs/BRANDING.md](docs/BRANDING.md) for the ownership and adoption details.

Native development uses an Expo development client through the native scripts; native runtime acceptance is a separate validation gate and is not implied by web certification. The current release-candidate baseline includes iOS Simulator Release XCUITest acceptance and native visual comparison on the semantic iPhone 17 Pro / iOS 26.5 profile. Android native acceptance is deferred/waived under Policy B. Human VoiceOver, exact Dynamic Type settings, and physical-device behavior remain explicit boundaries.

The current static web export remains one approximately 4.5 MB bundle. Route-level splitting is an application-scale follow-up. Use `npm run ios:verify` for the expensive fresh-CNG native lane and `npm run release:verify` for final governance invariants. See [docs/RELEASE_CANDIDATE_1_0.md](docs/RELEASE_CANDIDATE_1_0.md) for the exact next-step release procedure; this phase does not tag or publish.
