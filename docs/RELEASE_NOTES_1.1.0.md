# Expo Base 1.1.0

Expo Base `1.1.0` is a minor-compatible source release candidate building on the tagged `1.0.0`
foundation. It expands how teams can generate, integrate, and safely upgrade applications while
keeping shared UI, runtime, and product ownership boundaries intact.

## What changed since 1.0.0

- **Standalone generated applications:** The generator can create a self-contained product
  repository with selected Expo Base packages, local Golden tooling, source provenance, and a
  bounded acceptance command. Acceptance checks locality and package boundaries, Expo public
  configuration, TypeScript and Golden contracts, a static web export, runtime startup, and a
  browser smoke. Its result is foundation evidence, not a production-readiness claim for the
  consuming product.
- **React Hook Form integration:** `@expo-base/form-rhf` adds adapters for supported shared fields,
  lifecycle/error handling, and additional text-area and date-field flows. Routes can keep using
  semantic Expo Base fields and shared form lifecycle behavior when a product chooses React Hook
  Form.
- **Application-facing compatibility:** Historical `@precision-calm/*` import paths have
  compatibility packages that forward to the canonical `@expo-base/*` owners. Existing 1.x
  application imports remain supported while teams adopt the Expo Base namespace on their own
  schedule.
- **Safer migration planning:** The migration package adds an exact-provenance, read-only upgrade
  plan. It reports candidate carry-forwards, dependency alignment, product-owned paths, and manual
  review needs without writing into or regenerating the consuming product.
- **Correctness and acceptance hardening:** UI, forms, overlays, semantic layout, theming, focus,
  generated authentication flows, and iOS controlled-field automation received targeted fixes.
  Generator acceptance now keeps platform and product obligations explicit, and native/web
  certification contracts more clearly bind evidence to the tested source.

## Compatibility and migration

This is a SemVer minor release: existing application-facing 1.x APIs remain compatible, with new
capabilities added alongside them. No intentional breaking API change is included. Compatibility
packages support the prior namespace, while the upgrade planner provides advisory evidence for
reviewed manual migration. It does not automatically rewrite applications.

The Expo, React, and React Native compatibility pins remain unchanged. Internal workspace
dependencies continue to use their existing wildcard semantics. Workspace packages remain private;
this source release does not introduce npm publication behavior.

## Boundaries unchanged

- Android native acceptance remains deferred and uncertified. The historical `v1.0.0` Policy B
  waiver is not new Android evidence for `1.1.0`. No Android PASS, TalkBack usability acceptance, or
  universal-native support is claimed.
- Human VoiceOver usability, exact real-device Dynamic Type behavior, and physical-device hardware
  behavior remain outside the evidence boundary.
- Generated product integrations remain product-owned. Standalone acceptance does not establish
  backend/provider integration, downstream production readiness, or deployment readiness.
- This candidate does not publish npm packages, create a GitHub Release or tag, deploy EAS/store
  artifacts, merge or move `main`, or release a downstream product.
