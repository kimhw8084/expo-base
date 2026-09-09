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
