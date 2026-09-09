# Expo Base implementation status — 2026-09-08

## Current phase

Ultimate Golden convergence pass 2 is implemented in this checkout. The web/reference foundation remains separate from native validation and release governance; this document does not publish or tag a release.

## Development gates complete

- shared tokens, platform behavior, layouts, UI primitives, forms, overlays, navigation, data composition, feedback, motion, scoped server state, runtime services, and opt-in capabilities
- Golden Plus identity/status/code/copy, timeline, portable date/time/range, delimited export, and area/stacked visualization owners
- Precision Calm light/dark theme and default/compact density behavior
- keyboard and validation focus lifecycle, including the shared web keyboard-dismissal correction
- async single-flight actions plus query/cache/invalidation/optimistic lifecycle and stale-response protection across runtime/auth/session boundaries
- reference-app and generator architecture parity
- generator tests plus TypeScript validation of a fresh generated application
- Golden architecture/catalog: 76 owners, 0 feature-route violations, 24 ownership records, and 56 discovery challenges
- Expo Base Doctor: 94 passed, 0 failed, 0 warnings
- public API snapshot: 379 symbols across 16 UI packages
- optional visualization module: `@precision-calm/visualization-advanced` (ScatterPlot, Histogram, Heatmap, grouped/diverging/normalized/horizontal bars, multi-line, waterfall, range, and bullet charts); absent from the facade and minimal generator
- owner certification: 21 executable stable visual records, 140 declared states with 0 unmapped states, 53 explicit recipe/runtime/native boundaries, and 0 unaccounted-for catalog owners
- dependency graph: 47 workspaces, 147 internal edges, 0 cycles, 0 violations
- fresh static web export, isolated certification server, and browser certification
- repository, configuration, package, and documentation review

## Current certification

- `npm run runtime:verify` — PASS
- `npm run golden:verify` — 26 combined visual, semantic, and interaction-performance checks
- `npm run runtime:test:web` — 385 passed / 2 intentional skips across Chromium, Firefox, and WebKit
- `npm run mobile:verify` — 58 passed / 17 intentional visual-profile skips across Chromium and WebKit mobile contexts
- `npm run typecheck:runtime-ui` — PASS
- `git diff --check` — PASS
- no stale certification server or test process remains after the suite

## Current release-candidate certification

The current release-candidate baseline has completed the local iOS Simulator Release certification: 17/17 native tests and 9/9 native visual baselines on the semantic iPhone 17 Pro / iOS 26.5 profile. Full Release certification regenerates the ignored native project from current Expo configuration before testing. The durable certification record is `release-candidate.certification.json`; its source-tree hash excludes only that record so a metadata-only commit cannot invalidate the executable source identity.

Remaining release boundaries are deliberate: Android native acceptance is deferred/waived under Policy B; human VoiceOver usability traversal, exact Dynamic Type settings behavior, and physical-device hardware/safe-area behavior are not certified. The next release phase is governance execution and then an explicitly reviewed tag/release decision; this repository does not tag or publish from the certification lane.

## Canonical commands

- `npm install` — install the pinned workspace baseline
- `npm run runtime:verify` — run contracts, generator checks, Doctor, and runtime preflights
- `npm run golden:verify` — run Golden structural, visual, semantic, and performance certification
- `npm run runtime:test:web` — export and certify the reference app in Chromium, Firefox, and WebKit
- `npm run ios:verify` — regenerate the CNG native project and run Release XCUITest plus native visual comparison
- `npm run release:verify` — validate the release-candidate record, governance contracts, and clean-source invariants
- `npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet` — generate a new product workspace

## Known limitations

The web export uses supported route splitting and remains within the Golden budgets (4,951,877 total JavaScript bytes; 4,710,360-byte heaviest initial route; advanced visualization remains lazy and is absent from the minimal generator profile). Human VoiceOver, exact Dynamic Type settings, and physical-device-only behavior remain explicit release boundaries. Generated apps also contain replaceable demo service/auth/session adapters that must not be shipped unchanged.
