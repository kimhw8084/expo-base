# Android Native Acceptance

`android.certification.json` is the current Android evidence authority for the reference app. It
binds the post-v1.1.0 candidate to the exact protected base, an explicit Pixel 6 API 35 emulator
profile, the current Expo and React Native versions, native scenarios, evidence files, and claims
that remain outside this lane.

Run `npm run android:verify` to validate the manifest and runner contracts, run deterministic
failure/generator tests, cleanly regenerate Android with Expo CNG, build the release variant with
bundled JavaScript, and execute the repository-owned Android instrumentation suite. The generated
`apps/reference/android` directory is disposable and ignored. `npm run runtime:android` remains the
development-build command and does not certify a native runtime.

The certification runner applies the manifest's bounded Gradle execution profile after each clean
CNG pass: no more than two Gradle workers and at least 1024 MB of metaspace. It retains Android's
release lint tasks and archives the effective generated `gradle.properties` plus its SHA-256. This
keeps the source-to-build configuration visible while avoiding the 512 MB CNG default that exhausted
the hosted runner during parallel release lint analysis.

The release lane uses AndroidX UI Automator 2.3.0 against the emulator's accessibility window roots.
React Native 0.86.3's `ReactModalHostView` renders Modal children in a `ComponentDialog` backed by a
`DialogRootViewGroup`; React Native forwards the Modal `testID` as that root's resource ID, and
`ReactAccessibilityDelegate` exposes child `testID` values as resource IDs. The suite selects
visible actionable Modal children by those current native resource IDs, proves they are absent before
opening and after dismissal, activates them, and checks Android system Back restoration. Form
validation uses the shared summary's accessible error action and confirms that activating it focuses
the first invalid field. It selects that actionable item by its accessibility label instead of
depending on a wrapper view's test ID. It does not use Espresso dialog roots or infer runtime
observability from source text.

Historical CHG-149 contributes failure classifications only. The current lane was built from the
current reference app and shared owners; no R18 candidate code or selector set was restored. It
avoids the failed Espresso `isDialog()` root and accessibility-label-only Modal queries, and it does
not use the unsupported `UiObject2.isVisible()` method from the earlier harness.

The `android:verify` output is written to `test-results/android-native-certification`. It includes
the exact commit/tree and protected base identity, generated Android source/config digest,
application ID and dependency versions, API/device/emulator profile, release APK SHA-256 and
bundled-JavaScript check, JUnit test counts/failures, complete raw logcat, crash/ANR disposition,
workflow IDs, the raw AVD profile configuration and its SHA-256, the effective Gradle properties and
their SHA-256, and home/modal screenshots. The
profile resolver reads Android's persisted locale property first, then the configured system locale
setting and product locale as explicit fallbacks; each raw probe is retained. The GitHub Actions workflow uploads this directory after
success or failure and runs for relevant `codex/**` pushes and pull requests to `main`.
The hosted x86_64 profile requires the runner's `/dev/kvm`; the workflow grants the job user access
and reports a prerequisite failure if the runner does not expose that device.

The automated claim covers the current reference app on the declared emulator only. Human TalkBack
review, physical-device font scaling and safe-area variance, camera, biometrics, permissions,
haptics, store signing/upload, publication, deployment, provider behavior, and downstream product
readiness remain outside the claim. This lane does not alter or retroactively qualify the published
Expo Base v1.1.0 release.

## Upstream runtime references

- [React Native 0.86.3 `ReactModalHostView.kt`](https://github.com/react/react-native/blob/v0.86.3/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/modal/ReactModalHostView.kt)
- [AndroidX UI Automator API reference](https://developer.android.com/reference/androidx/test/uiautomator/UiDevice)
