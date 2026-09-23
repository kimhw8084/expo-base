# Expo Base implementation status — 2026-09-22

## Current source baseline

Protected `main` is at `ea9ac98786ae60ee8c2a9e378455770d0bdac05e` with tree
`5121ddd1b1b806a95386ca4f235afd0616d01233`. CHG-176 was integrated through PR #28. Its accepted
head, `c28060f2710f706d60c3c9b4e4ec1ae2e48d3a7e`, has the same tree as current `main`. CHG-176
changed only two iOS certification-harness files; it changed no Product/runtime code. The current
work updates release-governance metadata and status documentation for this qualified source
baseline. It does not promote or publish a release. The `v1.0.0` tag remains historical evidence.

## Current-main qualification evidence

- Full `npm run ios:verify` passed on the exact CHG-176 accepted tree, which equals the current-main
  tree: 17 Release tests and 9 existing visual baselines on the iPhone 17 Pro / iOS 26.5 Simulator
  profile. This record carries forward that execution; it does not claim a new iOS run or result
  bundle.
- On that exact accepted head, Runtime Web run `35811032437` passed and Golden Certification run
  `35811032442` passed. Golden Certification includes structural, mobile, and golden jobs. The
  refreshed record keeps `runtime-web`, `structural`, `mobile`, and `golden` as required hosted
  checks; protected integration reruns those workflows for the candidate.
- CHG-175 R1 had also passed `runtime:verify`, `runtime:test:web`, `golden:verify`, and
  `mobile:verify` before the CHG-176 harness-only repair. Those runs are earlier validation, not
  new executions on the current-main tree.

The certification record uses the exact protected-main provenance SHA above and binds the final
candidate's tracked source tree with the repository's documented source-tree hash. Its `certifiedAt`
records this governance-record refresh; native evidence remains the CHG-176 execution described
above.

## Development foundation

- shared tokens, platform behavior, layouts, UI primitives, forms, overlays, navigation, data
  composition, feedback, motion, scoped server state, runtime services, and opt-in capabilities
- Golden Plus identity/status/code/copy, timeline, portable date/time/range, delimited export, and
  area/stacked visualization owners
- Expo Base light/dark theme and default/compact density behavior
- keyboard and validation focus lifecycle, including the shared web keyboard-dismissal correction
- async single-flight actions plus query/cache/invalidation/optimistic lifecycle and stale-response
  protection across runtime/auth/session boundaries
- reference-app and generator architecture parity, including fresh-app tests and type validation
- Golden architecture/catalog: 76 owners, 0 feature-route violations, 24 ownership records, and 56
  discovery challenges
- Expo Base Doctor: 94 passed, 0 failed, 0 warnings
- public API snapshot: 379 symbols across 16 UI packages
- optional `@expo-base/visualization-advanced` module; absent from the facade and minimal generator
- owner certification: 21 executable stable visual records, 140 declared states with 0 unmapped
  states, 53 explicit recipe/runtime/native boundaries, and 0 unaccounted-for catalog owners
- dependency graph: 47 workspaces, 147 internal edges, 0 cycles, 0 violations

## Tagged `v1.0.0` historical evidence

These results describe the tagged `v1.0.0` baseline. Current-main qualification is listed above.

- `npm run runtime:verify` — PASS
- `npm run golden:verify` — 26 combined visual, semantic, and interaction-performance checks
- `npm run runtime:test:web` — 385 passed / 2 intentional skips across Chromium, Firefox, and
  WebKit
- `npm run mobile:verify` — 58 passed / 17 intentional visual-profile skips across Chromium and
  WebKit mobile contexts
- `npm run typecheck:runtime-ui` and `git diff --check` — PASS
- iOS Simulator Release certification — 17/17 native tests and 9/9 reviewed visual comparisons
  on the iPhone 17 Pro / iOS 26.5 profile

The tag and its certification remain historical; the refreshed current-source record does not
replace the tag or represent a new published release.

## Support and release boundaries

- Android native certification remains deferred/waived and uncertified under Policy B after canceled
  CHG-149. No Android PASS or universal-native support is claimed.
- Human VoiceOver usability traversal has not been performed. Dynamic Type audit coverage is
  simulator-limited on the installed iOS 26.5 runtime. Physical-device hardware, haptics, camera,
  biometrics, and device-specific safe-area behavior are not certified.
- Generated products must provide product-specific backend, authentication, session-security, and
  linking adapters. Backend authorization is also product-owned and remains outside framework
  certification.

## Canonical commands

- `npm ci` — install the pinned workspace baseline under supported Node 22
- `npm run runtime:verify` — run runtime contracts, generator checks, Doctor, and preflights
- `npm run golden:verify` — run Golden structural, visual, semantic, and performance certification
- `npm run runtime:test:web` — export and certify the reference app in Chromium, Firefox, and WebKit
- `npm run ios:verify` — regenerate the CNG native project and run Release XCUITest plus native
  visual comparison
- `npm run release:verify` — validate the recorded evidence, governance contracts, source-tree
  identity, and clean-worktree invariant
- `npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet` — generate a
  new product workspace

Native commands use a development client through `npm run runtime:ios` and
`npm run runtime:android`; Expo Go is not part of the supported workflow.
