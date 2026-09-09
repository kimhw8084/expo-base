# iOS Native Product Acceptance

## Status

This run reached native build, install, and development-client launch, but it did not complete the required interactive acceptance matrix because the current shell environment exposes no deterministic simulator input channel. `simctl` provides lifecycle, URL, screenshot, and log operations but no touch/keyboard injection; the Simulator process exposes no accessible window to the available AppleScript path; and no approved UI automation bridge (such as IDB, Maestro, or Appium) is installed.

Therefore this document records native execution evidence and a bounded environment limitation. It does not claim native product acceptance.

## Environment

- Device: iPhone 17 Pro simulator
- UDID: `E97BB776-234F-41F5-8544-5E3924121C1F`
- Runtime: iOS 26.5
- Host: macOS 26.6.2, Apple Silicon arm64
- Xcode: 26.6 (17F113)
- Node: 22.23.2
- CocoaPods: 1.17.0
- Source under test before the native fix: `bf040f87ce905dd1f992db187c30a61529005a77`

## Build and launch evidence

Established command:

```text
npm run runtime:ios -- --device E97BB776-234F-41F5-8544-5E3924121C1F
```

Results:

- `runtime:verify`: PASS, including runtime UI typecheck, native shell contracts, architecture, generator, and Doctor (`94 passed / 0 failed / 0 warnings`).
- CNG/prebuild and CocoaPods: PASS.
- Xcode iOS Debug build: PASS (`0 errors`, one Expo Dev Launcher build-script warning on the rerun).
- Install on iPhone 17 Pro: PASS.
- Development-client launch and Metro bundle: PASS.
- Root Expo Base surface rendered with no redbox, native crash, or missing-native-module error.
- Evidence: `test-results/ios-native-acceptance/IOS-001-after-patched-launch.png`, `IOS-001-relaunch-connected.png`, and `IOS-020-home-dark.png`.

## Reproduced and fixed native-owned defect

### IOS-DEF-001 — Development-client launch URL redirected to link-error

- Severity: P1 during reproduction.
- Root cause: `+native-intent` passed the Expo development-client URL (`exp+...://expo-development-client/...`) through the product incoming-link policy. The policy correctly rejected that internal development transport URL and returned `/link-error`.
- Owner: reference app native-intent/linking boundary.
- Fix: recognize only the Expo development-client launch protocol/host in `+native-intent` and route it to `/`; register the configured `expo-base` application scheme in the reference incoming-link policy. The production incoming-link validation remains in force for all other URLs.
- Regression: `check:native-shell-contracts`, `test:linking-contracts`, `check:linking-contracts`, and the repeated native build/launch path.
- Result: PASS after the fix; the root screen rendered instead of the link-error screen.

## Scenario evidence

| Scenario | Result | Evidence / limitation |
| --- | --- | --- |
| IOS-001 cold launch | PASS after fix | Native build launch; root screen screenshot |
| IOS-002 terminate/relaunch | PASS for process/bootstrap | `simctl terminate` + launch + dev-client URL; root screenshot |
| IOS-003 background/resume | NOT EXECUTED | No deterministic simulator lifecycle/input bridge for background gesture and resume observation |
| Native safe-area surfaces | PARTIAL OBSERVATION | Real Dynamic Island/home-indicator frame visible in screenshots; no full surface matrix executed |
| Primary navigation/taps | NOT EXECUTED | Touch injection unavailable |
| Native forms and keyboard controller | NOT EXECUTED | Text/tap/keyboard injection unavailable |
| Combobox/select/popover | NOT EXECUTED | Touch/scroll/input injection unavailable |
| Dialog and alert dialog | NOT EXECUTED | Touch injection unavailable |
| Bottom sheet | NOT EXECUTED | Touch/drag injection unavailable |
| Command launcher | NOT EXECUTED | Touch/input injection unavailable |
| Data workspace | NOT EXECUTED | Touch/scroll injection unavailable |
| Server-state lifecycle | NOT EXECUTED | Required refresh/mutation actions unavailable |
| Visualizations/showcases | RENDER-ONLY OBSERVATION | Home shell rendered; route interaction matrix not executed |
| Orientation transition | NOT EXECUTED | No supported orientation control in available CLI path |
| Large text | NOT EXECUTED | No deterministic native settings/input path used |
| Reduced motion | NOT EXECUTED | No deterministic native settings path used |
| RTL/pseudo | NOT EXECUTED | App interaction/settings path unavailable |
| VoiceOver | NOT EXECUTED | Not practical in this shell environment |

## Native warnings and limitations

- Xcode reported the Expo Dev Launcher strip-local-network-keys script has ambiguous dependencies and may run every build. This is a development-build warning, not an app failure.
- UIKit reported `UIKeyboardLayoutStar` and `RCTScrollViewComponentView` focus-caching warnings. These are framework/system diagnostics observed during launch; no product failure was established.
- Launching the installed development client without a Metro URL produced the expected dev-launcher `bundle scheme is file` warning and blank launcher state. The established workflow supplies the Metro URL and rendered the app correctly.
- Apple launch-measurement CA event messages were simulator diagnostics.

## Repository changes

The native launch defect fix changed:

- `apps/reference/app/+native-intent.tsx`
- `apps/reference/linking.ts`
- `scripts/check-native-shell-contracts.mjs`

Generated `apps/reference/ios/` output remains ignored/generated. No dependency, framework, or product-design changes were made.

## Native-only work not completed

The following remain unverified and require a usable native interaction harness or manual simulator control:

- actual iOS keyboard appearance/avoidance and keyboard-controller behavior;
- native modal and bottom-sheet interaction;
- touch target execution and scrolling;
- orientation transitions;
- native large-text and reduced-motion settings;
- VoiceOver execution;
- actual safe-area behavior across all surfaces;
- native capability permission flows.

Android native acceptance remains deferred/waived under Policy B.

## Verdict

`IOS NATIVE ACCEPTANCE BLOCKED BY ENVIRONMENT`

This is an execution-environment limitation, not a remaining Expo Base product defect. A full `IOS NATIVE ACCEPTANCE PASSED` verdict requires rerunning the matrix with a deterministic simulator UI-control path.

## Manual-assisted completion run

### Run metadata

- Source SHA: `29d9545d5f022562373e5af5db7987177537778a`
- Branch: `main`
- Device: iPhone 17 Pro Simulator (`E97BB776-234F-41F5-8544-5E3924121C1F`)
- Runtime: iOS 26.5
- Build workflow: `npm run runtime:ios -- --device E97BB776-234F-41F5-8544-5E3924121C1F`
- Build/install/launch: PASS
- `runtime:verify`: PASS
- Doctor: `94 passed / 0 failed / 0 warnings`

The app remained connected to one Metro session while manual interaction batches were performed. CLI-owned screenshots and logs were collected by Codex; the user supplied only touch, typing, scrolling, and rotation actions.

### Manual scenario batches

| Batch | Scenarios | Result |
| --- | --- | --- |
| Navigation and scrolling | `IOS-NAV-01`–`IOS-SAFE-02` | PASS reported; primary destinations, active state, scrolling, and bottom-safe-area visibility were usable |
| Forms and keyboard | `IOS-FORM-01`–`IOS-FORM-08` | PASS reported; text entry, focus progression, keyboard reachability, validation, correction, reset/state controls, and selector response were usable |
| Selectors, overlays, commands | `IOS-SELECT-01`–`IOS-OVERLAY-08` | PASS reported; selection, empty/reopen behavior, dialog/sheet dismissal, command filtering, and visible dismissal were usable |
| Data and server state | `IOS-DATA-01`–`IOS-DATA-08` | PASS reported; search/filter/selection/paging and refresh/error/rollback controls were usable |
| Visualization and showcases | `IOS-VIZ-01`–`IOS-SHOWCASE-09` | PASS reported; chart selection, chart states, axes/labels, and analytics/finance/monitoring compositions were usable |
| Theme, text, locale, motion, orientation | `IOS-THEME-01`–`IOS-ORI-04` | PASS reported; dark mode, large text, compact density, pseudo LTR/RTL, reduced motion, and rotation remained usable |
| Background/resume and capabilities | `IOS-LIFE-01`–`IOS-CAP-04` | PASS reported; no crash or stuck state was reported after resume/capability checks |

### Orientation note

During the first navigation batch the user reported that returning from landscape appeared to require a second rotation action. The later orientation stress batch was reported as working. No stable Expo Base layout failure was reproduced independently; this remains a simulator-orientation synchronization observation rather than an open product defect.

### Native warnings observed

No redbox, native crash, missing module, navigation exception, or Expo Base React error was reported during the manual run. The development session emitted the following simulator/framework diagnostics:

- UIKit focus-caching messages for `RCTScrollViewComponentView`.
- Remote text-input session and accumulator timeout messages during keyboard use.
- CoreHaptics could not find the simulator haptic pattern library.
- These are classified as simulator/framework diagnostics; no correlated product failure was reported.

### Screenshot evidence

The retained manual evidence is under `test-results/ios-native-acceptance-manual/` and includes:

- `IOS-001-home-before-manual.png`
- `IOS-ORI-001-after-return.png`
- `IOS-FORM-08-after-validation.png`
- `IOS-OVERLAY-08-pass.png`
- `IOS-DATA-08-pass.png`
- `IOS-THEME-01-dark-large-before-controls.png`
- `IOS-THEME-06-after-stress.png`
- `IOS-CAP-04-final.png`

### Accessibility and capability limits

`VOICEOVER EXECUTION NOT COMPLETED`.

Optional capability interactions were manually exercised where exposed by the reference capability lab. Simulator-limited or permission-dependent results are not treated as product failures. Actual VoiceOver, native permission behavior, and physical-device capability behavior remain outside this run’s evidence.

### Manual-assisted disposition

The previously blocked touch/keyboard limitation was materially reduced by the manual Simulator session. The manual results reported no P0, P1, or P2 app defect. The remaining native-only evidence boundaries are VoiceOver, physical-device safe-area behavior, and OS capability behavior.

Android native acceptance remains deferred/waived under Policy B.

## Updated verdict

`IOS NATIVE ACCEPTANCE PASSED`

Recommendation: **PROCEED TO FINAL 1.0 RELEASE-CANDIDATE GOVERNANCE**.

## Automated XCUITest certification implementation

The manual-assisted completion above is preserved as historical evidence. The repository now also contains a first-party Apple XCTest/XCUITest lane so native interaction coverage does not depend on repeated user-assisted tapping.

### Architecture

- XCTest sources live outside generated native output in `tests/native/ios/`.
- `scripts/generate-ios-ui-test-project.mjs` deterministically creates the ignored `ExpoBaseReferenceUITests` target and scheme after CNG/prebuild.
- Generated `apps/reference/ios/` remains ignored and is never the source of truth for the test target.
- The product lane builds Release with bundled JavaScript and runs against bundle ID `com.expobase.reference`.
- The smoke lane uses the same target in Debug; the established `runtime:ios` workflow remains the development-client/Metro smoke path protecting `IOS-DEF-001`.
- `testID` ownership stays on meaningful shared or reference controls; the source contract check prevents the required navigation, form, geometry, and hittability selectors from disappearing.
- Failure handling attaches an XCTest screenshot and accessibility hierarchy; `.xcresult` and the bounded xcodebuild log remain under `test-results/ios-native-certification/`.
- Release runs also write nine named screenshots and compare them against the curated iPhone 17 Pro/iOS 26.5 baseline set in `tests/native/ios/baselines/`; comparison uses a 3-channel tolerance and a 0.2% differing-pixel ceiling, and baseline updates are never automatic.

### Commands

```text
npm run check:ios-certification
npm run check:native-ui-contracts
npm run ios:test:ui
npm run ios:test:smoke
npm run ios:verify
```

`ios:verify` requires Node 22, validates the simulator profile, generates the test target, builds the Release product lane, runs XCUITest serially, and writes a mode-specific summary from `xcresulttool`. Release and Debug use isolated result bundles so focused and full runs cannot overwrite one another's evidence. `IOS_ONLY_TESTING` supports focused scenario execution without changing the permanent suite.

### Proof-of-capability mapping

The ten proof requirements are represented in `ios.certification.json`: launch, native selector lookup, tap, text input, scroll, orientation round-trip, XCTest screenshot, geometry/hittability, and the XCTest accessibility audit. POC-07 through POC-10 intentionally map to already-executed focused tests where the same executable proof covers the requirement; they are not claimed as unexecuted aliases.

### Product and smoke lanes

The Release lane is the product acceptance lane and does not require Metro. The Debug lane is a bounded native smoke lane; development-client transport is separately protected by `npm run runtime:ios` and the native shell/linking contracts. This prevents development-client routing behavior from contaminating the product acceptance matrix.

## Automated native acceptance result

> Historical note: the automated result below records the initial XCUITest implementation run. The convergence addendum at the end of this document is the authoritative result after the keyboard-aware popover correction and deterministic visual evidence closure.

### Run metadata

- Source before the initial XCUITest certification implementation: `2209f9a1a35be7e2f2f61fe00c0d616e13bd11f7`.
- Device: iPhone 17 Pro Simulator (`E97BB776-234F-41F5-8544-5E3924121C1F`).
- Runtime: iOS 26.5; host macOS 26.6.2 arm64; Xcode 26.6; Node 22.23.2; CocoaPods 1.17.0.
- Product build: Release bundled JavaScript.
- Latest focused form-family execution: 1/1 XCUITest test passed, 0 failures, 220.534 seconds; the isolated Release result bundle and summary are retained.
- Manifest: 25 classified scenarios; 21 executable XCUITest dispositions, 1 executable source-contract disposition, and 3 explicit boundaries.
- Full Release evidence: `test-results/ios-native-certification/ExpoBaseNativeCertification-release.xcresult`, `summary-release.json`, and `xcodebuild-release.log`.
- Full Debug evidence: `test-results/ios-native-certification/ExpoBaseNativeCertification-debug.xcresult`, `summary-debug.json`, and `xcodebuild-debug.log`.
- Release visual evidence: `test-results/ios-native-certification/visual-release/` and the nine tracked baselines under `tests/native/ios/baselines/iphone-17-pro-ios-26.5/`.

### Automated scenario coverage

The executable suite covers:

- cold launch, relaunch, primary navigation targets, route landmarks, and native target geometry;
- text entry, secure password entry, native software keyboard appearance, keyboard Next/Done progression, form validation reachability, and error summary rendering;
- representative native form-family interaction across text/search/password/contact/number/currency/textarea, checkbox/radio/segmented/switch, stepper/code, select/combobox/multiselect, and date/time/range specimens;
- action menu, native Dialog, BottomSheet, command launcher filtering/selection/dismissal, and overlay action reachability;
- adaptive data workspace row selection and details, server-state refresh/relaunch, and advanced visualization route rendering;
- analytics, finance, and monitoring flagship route rendering and scrolling;
- runtime dark theme, compact density, pseudo LTR/RTL controls, reduced motion, and orientation state preservation;
- XCTest screenshot attachments, failure screenshots/hierarchy attachments, element frames, hittability, and a native `.hitRegion` accessibility audit.

### Native defect found and fixed

#### IOS-DEF-002 — native overlay content was collapsed into an inaccessible panel

- Severity: P1 native interaction/accessibility defect during certification.
- Root cause: the shared Dialog and BottomSheet panel set `accessible` on the native container, causing iOS to expose the panel as one accessibility element and hide descendant titles/actions from XCUITest/native assistive semantics.
- Owner: shared `packages/overlays` Dialog and BottomSheet owners.
- Fix: retain the panel-level accessibility grouping only on web; native panels expose their actionable descendants while preserving modal semantics.
- Regression: `testOverlayMenuDialogAndSheetLifecycle`, native accessibility-tree queries, and the full 17-test Release lane.
- Result: action-menu selection, Dialog Cancel, BottomSheet title, and BottomSheet Close all pass natively.

The compact data table also received a selector-owner correction: when row selection is enabled, the stable row identifier is placed on the actionable content Pressable rather than only on its non-hittable layout container. Form choice owners now expose stable option identifiers, and SelectField forwards its certification identifier to the native trigger. These are certification infrastructure/owner semantics, not visual redesigns.

### Accessibility and boundaries

- The XCUITest `.hitRegion` audit executes on the home surface.
- Element lookup, labels, states, frames, and hittability are asserted on representative controls.
- Dynamic Type audit remains `SIMULATOR_LIMITED` because Xcode 26.6 reports that category unsupported by the installed iOS 26.5 simulator.
- `VOICEOVER EXECUTION NOT COMPLETED`; automated accessibility-tree/audit evidence does not claim human VoiceOver usability.
- Physical hardware remains required for tactile haptics, camera fidelity, biometric fidelity, physical-device safe-area variation, and other hardware-specific behavior.
- No GitHub native job was added because the repository cannot guarantee the exact Xcode 26.6/iOS 26.5 simulator image on a hosted runner. The lane is deterministic and executable locally with the pinned environment above; CI integration should be added only when that macOS image is available as a controlled runner.

### Diagnostics

The run produced no Expo Base crash, redbox, missing-native-module exception, navigation exception, or unhandled product error. The following remain classified as framework/simulator diagnostics: Xcode debugger-version-store messages, duplicate simulator WebKit accessibility-bundle messages, Hermes build-phase output-dependency warnings, and the simulator's UIKit focus/cache diagnostics.

### Automated disposition

- P0 open: 0
- P1 open: 0
- P2 open: 0
- P3 open: 0 from this lane; the remaining VoiceOver, Dynamic Type, physical-device, and framework-diagnostic items are explicit boundaries rather than product defects.

The automated lane now provides repeatable Simulator acceptance for every classified Simulator-testable scenario in the manifest. Native runtime acceptance still does not equal physical-device acceptance or human VoiceOver certification.

Android native acceptance remains deferred/waived under Policy B.

### Final verification and stability closure

- `npm run ios:test:smoke`: 17/17 Debug XCUITest tests passed, 0 failures in 665.395 seconds; `summary-debug.json` reports the same result.
- Final unfiltered `npm run ios:verify`: 17/17 Release XCUITest tests passed, 0 failures in 635.709 seconds; `summary-release.json` reports the same result.
- Final high-risk stability set: three consecutive `npm run ios:verify` executions with the focused 8-test matrix; each run passed 8/8 with 0 failures and no retries.
- The focused matrix covered launch, navigation/geometry, text input, native keyboard/form validation, overlays, command filtering/selection, data-row selection, and orientation state preservation.
- One earlier focused run exposed a test-harness input-ordering issue (`offline` could be synthesized as `offlnei`); the command and form robots now type and verify controlled fields character-by-character. The final focused and full runs pass with that correction.
- `npm run runtime:verify`: PASS, including typecheck, architecture, generator, and Doctor (`94 passed / 0 failed / 0 warnings`).
- `npm run golden:verify`: PASS; Golden structural checks passed, 26 semantic/visual/performance browser checks passed.
- `npm run runtime:test:web`: PASS; 385 tests passed and 2 intentional skips across Chromium, Firefox, and WebKit.

The XCUITest lane is now considered stable on the pinned local Xcode 26.6/iOS 26.5 environment. A hosted native CI job was not added because the repository cannot guarantee that exact simulator image on GitHub-hosted macOS runners.

## Automated certification verdict

`IOS AUTOMATED NATIVE CERTIFICATION PASSED — SIMULATOR ACCEPTANCE COMPLETE`

Recommendation: **PROCEED TO FINAL 1.0 RELEASE-CANDIDATE GOVERNANCE**.

## Automated native certification convergence addendum

This addendum is the authoritative final result for the current certification work. It preserves the earlier blocked/manual/XCUITest history above and records the shared-owner defect found during the final full native run.

### Final source and lane

- Source under final verification: `bb82e1151c7d034ce8f81ab92af0c734e396a851` before this certification commit; the final pushed commit is reported with this run.
- Product lane: Release build with bundled JavaScript, no Metro dependency.
- Smoke lane: Debug XCUITest plus the existing development-client smoke workflow.
- Device: iPhone 17 Pro Simulator (`E97BB776-234F-41F5-8544-5E3924121C1F`), iOS 26.5, Xcode 26.6.

### Native defect found and fixed

#### IOS-DEF-003 — searchable popover options were hidden behind the native keyboard

- Severity: P1 native interaction/layout defect.
- Reproduction: focus a searchable native choice field, type `ame`, and attempt to select the visible `American Express` result. The result existed below the keyboard frame and was not hittable.
- Root cause: the shared `@precision-calm/overlays` Popover placement path reserved safe-area and persistent-navigation insets, but did not reserve the native keyboard frame when solving anchored overlay placement.
- Owner: `packages/overlays/src/Popover.tsx` and the shared platform anchored-overlay solver boundary.
- Fix: Popover now observes native keyboard frame/show/hide events and contributes the measured keyboard height to the shared bottom inset before solving placement. The overlay flips above the keyboard instead of becoming inaccessible.
- Regression: `testFormSpecimenFamiliesRespond` exercises the actual native searchable form flow; the full 17-test Release lane and 17-test Debug lane also cover the resulting overlay behavior.
- Result: focused reproduction passes; no hidden result remains behind the keyboard and no Expo Base error or unhandled rejection was produced.

### Final automated evidence

- Manifest: 25 classified native scenarios; 21 `AUTOMATED_XCUITEST`, 1 `AUTOMATED_CONTRACT`, and 3 explicit boundaries; 0 unclassified.
- POC-01 through POC-10: PASS through the mapped launch, selector, navigation, input, scroll, orientation, screenshot, geometry, and accessibility-audit tests.
- Full Release run 1: 17/17 XCUITest tests passed; 9/9 native visual comparisons passed.
- Full Debug run: 17/17 XCUITest tests passed in 832.997 seconds.
- Full Release run 2: 17/17 XCUITest tests passed in 1192.393 seconds; 9/9 native visual comparisons passed.
- Stability closure: three consecutive full executions (Release, Debug, Release), 0 retries and 0 failures. The final Release result bundle, summary, logs, and visual evidence are retained under `test-results/ios-native-certification/`.
- Curated native visual baselines: 9, all reviewed; baseline updates remain explicit and are never automatic. The final Release comparison used a 3-channel tolerance and a 0.2% differing-pixel ceiling.
- Native accessibility: element labels, states, frames, hittability, and the home `.hitRegion` audit passed. `VOICEOVER EXECUTION NOT COMPLETED`; automated XCTest audits do not claim human VoiceOver usability.

### Protected regression gates

- `npm run runtime:verify`: PASS; Doctor `94 passed / 0 failed / 0 warnings`.
- `npm run golden:verify`: PASS; Golden structural plus 26 semantic/visual/performance checks passed.
- `npm run runtime:test:web`: PASS; 385 tests passed and 2 intentional skips across Chromium, Firefox, and WebKit.
- Typecheck, native selector/manifest contracts, architecture, and diff checks: PASS.
- No dependency or public API change was introduced by IOS-DEF-003; the keyboard-aware behavior is a shared owner correction.

### Final boundaries

- Dynamic Type’s exact simulator accessibility-audit category remains `SIMULATOR_LIMITED` on the installed Xcode/iOS runtime.
- Human VoiceOver traversal remains a separate review boundary and was not executed.
- Physical haptic feel, camera/biometric fidelity, physical-device safe-area variation, and other hardware-specific behavior remain physical-device boundaries.
- No hosted native CI job was added because the exact Xcode 26.6/iOS 26.5 simulator image is not guaranteed by the available GitHub-hosted runners; the local first-party lane is deterministic on the pinned environment.

### Final convergence verdict

`IOS AUTOMATED NATIVE CERTIFICATION PASSED — SIMULATOR ACCEPTANCE COMPLETE`

Recommendation: **PROCEED TO FINAL 1.0 RELEASE-CANDIDATE GOVERNANCE**.

Android native acceptance remains deferred/waived under Policy B.
