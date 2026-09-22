# Android Native Certification

This candidate adds a first-party Android native certification lane for the exact
`apps/reference` source. It is intentionally separate from `runtime:android`, which remains a
development-build smoke path.

## Architecture

- [`android.certification.json`](../android.certification.json) is the source contract. Its
  profile is semantic (`standard phone`, API 35, x86_64); serial numbers, AVD names, and other
  machine identities are resolved only at execution time.
- [`scripts/run-android-native-certification.mjs`](../scripts/run-android-native-certification.mjs)
  checks candidate commit/tree identity, regenerates Android with fresh `expo prebuild --clean`,
  injects the repository-owned instrumentation target, resolves a matching emulator, and runs
  `connectedReleaseAndroidTest`. Release is required because the decisive lane must exercise
  bundled JavaScript.
- [`tests/native/android/ExpoBaseNativeAndroidTest.java`](../tests/native/android/ExpoBaseNativeAndroidTest.java)
  uses AndroidX UI Automator and the existing `testID`/accessibility-label semantics. It covers
  launch, primary navigation, text input and keyboard back dismissal, scroll, orientation,
  forms/validation, overlays and Android system back, representative data/server/showcase routes,
  runtime controls, and lifecycle relaunch.
- The lane writes candidate-bound provenance, resolved emulator properties, Gradle/JUnit output,
  filtered logcat, release APK identities, and representative screenshots below
  `test-results/android-native-certification/`.

Run the source checks with `npm run check:android-certification` and the decisive lane with
`npm run android:verify`. `npm run android:test:smoke` remains the separate `runtime:android`
development-client path. The runner fails closed on build/instrumentation failure, missing
reports/artifacts, crash or ANR diagnostics, uncaught React Native markers, and missing semantic
targets.

## Boundaries

Emulator evidence is bounded to the exact candidate and `apps/reference`. It does not certify
physical-device haptics, camera or biometrics, real-device safe-area variance, human TalkBack
usability, exact user font scaling/device settings, Play Store/signing/commercial compliance,
provider/backend integration, deployment, or downstream generated products. This change does not
rewrite the historical v1.0.0 Android waiver in `release-candidate.certification.json`.

When Node 22, a JDK, Android SDK/platform tools, and a matching headless emulator are unavailable,
`android:verify` records `BLOCKED` / `NOT_RUN` in the ignored result root with the exact missing
prerequisite; it never fabricates native PASS evidence.
