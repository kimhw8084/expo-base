# Expo Base implementation status — 2026-09-26

## `v1.1.0` release candidate

Expo Base `v1.1.0` is being prepared as a SemVer minor source-release candidate. Its exact protected
pre-release `main` provenance is commit
`9895d04052bb8aac98300d8d208f18614ae52b73`, tree
`d804954a85da03553fdcae3ae98e86a5733acad9`. CHG-261 independently certified and integrated that
current source/framework baseline. This candidate changes coordinated version metadata and release
governance, so its native and repository gates must be rerun against the `1.1.0` bytes; CHG-261's
native result is not inherited as candidate evidence.

`release-candidate.certification.json` records protected-main provenance separately from the
source-tree hash for the final candidate. The hash binds the exact tracked candidate contents,
excluding only that record. The candidate does not create a tag or GitHub Release, publish npm
packages, deploy EAS/store artifacts, merge, move `main`, or release a downstream product.

## Candidate qualification and boundaries

The `v1.1.0` candidate requires fresh `npm ci`, runtime, web, Golden, mobile, and iOS verification,
plus generator/standalone acceptance, migration, package-manifest, public-API, dependency-graph,
Node, CNG, and release-governance checks. Its native profile is the semantic iPhone 17 Pro / iOS
26.5 Simulator under Node `22.23.2` and Xcode `27.0`. The certification record captures actual
native results and the required hosted-check names.

Android native acceptance remains deferred and uncertified. The historical `v1.0.0` Policy B waiver
is not new Android evidence for this candidate; no Android PASS, TalkBack usability acceptance, or
universal-native support is claimed. Human VoiceOver review, exact real-device Dynamic Type behavior,
physical-device hardware behavior, npm publication, EAS/store deployment, and downstream-product
production readiness remain outside this candidate.

## Development foundation

- shared tokens, themes, density, layouts, UI, forms, overlays, navigation, data composition,
  feedback, motion, scoped server state, runtime services, and opt-in capabilities
- Golden Plus identity/status/code/copy, timeline, portable date/time/range, delimited export, and
  area/stacked visualization owners
- Expo Base light/dark theme and default/compact density behavior
- keyboard and validation-focus lifecycle, including the shared web keyboard-dismissal correction
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
- dependency graph: 47 production workspaces, 147 internal edges, 0 cycles, 0 violations

## Tagged `v1.0.0` historical evidence

These results describe the immutable tagged baseline. They do not qualify the `v1.1.0` candidate.

- `npm run runtime:verify` — PASS
- `npm run golden:verify` — 26 combined visual, semantic, and interaction-performance checks
- `npm run runtime:test:web` — 385 passed / 2 intentional skips across Chromium, Firefox, and
  WebKit
- `npm run mobile:verify` — 58 passed / 17 intentional visual-profile skips across Chromium and
  WebKit mobile contexts
- `npm run typecheck:runtime-ui` and `git diff --check` — PASS
- iOS Simulator Release certification — 17/17 native tests and 9/9 reviewed visual comparisons
  on the iPhone 17 Pro / iOS 26.5 profile

The tag and its certification remain historical; the `v1.1.0` candidate record does not replace or
rewrite them.

## Canonical commands

- `npm ci` — install the pinned workspace baseline under supported Node 22
- `npm run runtime:verify` — run runtime contracts, generator checks, Doctor, and preflights
- `npm run runtime:test:web` — export and certify the reference app in Chromium, Firefox, and
  WebKit
- `npm run golden:verify` — run Golden structural, visual, semantic, and performance certification
- `npm run mobile:verify` — run mobile-browser parity certification
- `npm run ios:verify` — regenerate the CNG native project and run Release XCUITest plus native
  visual comparison
- `npm run test:migration-upgrade-plan` and `npm run test:migration-compatibility` — check the
  advisory upgrade planner and application-facing compatibility paths
- `npm run release:verify` — validate recorded evidence, governance, coordinated versions,
  source-tree identity, and the clean-worktree invariant

Native commands use a development client through `npm run runtime:ios` and
`npm run runtime:android`; Expo Go is not part of the supported workflow.
