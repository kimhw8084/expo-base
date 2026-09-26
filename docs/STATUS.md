# Expo Base implementation status — 2026-09-26

## Current source baseline

Protected `main` is at `0470d0edd4306e3134da5f1a15816793e1955352` with tree
`665c2f82f9e04928d55eadd4d9d7de566eb998f1`, after CHG-186, CHG-187, and CHG-201. This is the
executable source baseline qualified below. The `v1.0.0` tag remains immutable historical evidence;
this governance refresh does not create or promote a release.

## Current-main qualification evidence

- Runtime Web run `35949677933` succeeded on exact-current `main`. Golden Certification run
  `35949678010` succeeded on the same source for structural, mobile, and golden jobs.
- R4 current-source `npm run ios:verify` passed on exact `main` under Node `v22.23.2` and Xcode
  `27.0`, using the iPhone 17 Pro / iOS 26.5 Simulator profile: 17 Release tests and 9 existing
  native visual baselines passed. The Release xcresult, summary, xcodebuild log, and visual evidence
  were present after execution. R4 evidence is recorded at
  `refs/heads/codex-fabric/evidence/expo-base/chg261-ios-current-source-verify-r4@923d177831f5c17541b5155a5872bb101850c1f6:.codex-fabric/audit.json`;
  its tested `main` commit was the sole parent, with zero source changes and a clean worktree.
- R5 changes only release-governance documentation and certification metadata. They are non-runtime
  changes; R4 did not execute these documentation bytes. The new record binds the final tracked
  candidate contents, excluding only the record itself. `npm run release:verify` validates that
  governance identity and repository contracts; it is not a new native or hosted execution.

The certification record uses the exact protected-main provenance SHA above and binds the final
candidate's tracked contents with the repository's source-tree hash. Its `certifiedAt` records this
governance refresh; the iOS evidence remains the R4 execution described above.

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

- Android native certification remains deferred/waived and uncertified after canceled CHG-149. No
  Android PASS, TalkBack usability acceptance, or universal-native support is claimed.
- Human VoiceOver usability traversal has not been performed. Dynamic Type audit coverage is
  simulator-limited on the installed iOS 26.5 runtime. Physical-device behavior, including hardware,
  haptics, camera, biometrics, and device-specific safe-area behavior, is not certified.
- Npm publication and EAS/store deployment are not claimed. Generated products must provide
  product-specific backend, authentication, session-security, and linking adapters; these downstream
  integrations remain outside framework certification.

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
