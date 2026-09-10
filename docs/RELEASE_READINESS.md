# 1.0 release-readiness checklist

This checklist separates development completion from runtime validation and release decisions for the Expo Base 1.0 release.

The current repository is a public source/template workspace, not a configured multi-package npm publication. The root MIT license governs the repository source; all 47 workspace packages remain private and any future package publication would require a separate package-release plan.

## Development gates — complete

- [x] Shared architecture and package ownership are coherent.
- [x] Precision Calm tokens, themes, density, layouts, and reusable compositions are contract-checked.
- [x] Forms, keyboard/focus behavior, overlays, navigation, feedback, data workflows, and async action ownership are hardened.
- [x] Auth, authorization, session security, linking, and service boundaries have stale-response and failure-path protection.
- [x] Reference-app showcase and generated-app foundation remain aligned.
- [x] Generator tests pass and a fresh generated application type-checks.
- [x] Expo Base Doctor passes with 94 checks, 0 failures, and 0 warnings.
- [x] Runtime UI typecheck and repository/package/API contracts pass.
- [x] Fresh static web export and Chromium/Firefox/WebKit certification pass: 385 passed / 2 intentional skips.
- [x] Mobile-browser parity certification passes: 53 passed / 17 intentional visual-profile skips across touch Chromium and mobile WebKit contexts.
- [x] Certification server uses an OS-assigned port and deterministic cleanup.
- [x] Documentation, configuration, dependency, and repository-hygiene review is complete.
- [x] Release-candidate metadata is aligned to the coordinated `1.0.0` version plan.

## Release-candidate baseline

- [x] Owner-approved MIT licensing and root `LICENSE`/manifest metadata are present.
- [x] iOS Simulator Release XCUITest acceptance: 17/17, with 9/9 reviewed native visual comparisons.
- [x] Three consecutive full native executions completed with zero retries and zero failures.
- [x] Semantic simulator selection and full Release CNG freshness are enforced by the repository tooling.
- [x] Native release certification is pinned to Node 22.x (minimum 22.13.0) and records protected-main provenance without requiring historical PR objects.
- [x] Final PM authorization for the release commit, tag, and repository release execution is recorded by this release operation.

## Explicitly deferred or waived for `1.0.0`

- Android runtime execution is deferred/waived for `1.0.0` under PM Policy B because the local Android runtime is unavailable.
- Human VoiceOver usability, exact Dynamic Type settings, physical-device hardware/safe-area behavior, and backend-integrated smoke validation remain explicit boundaries, not claims made by this repository candidate.

## Release decision gates — pending approval

- [x] PM-approved release model is a private repository/template release; npm publication is not configured.
- [x] PM-approved coordinated `1.0.0` metadata and Expo/EAS semantic app version are applied.
- [x] PM-approved native build-number policy keeps native numbers owner-managed, monotonic, and independent of semantic version.
- [x] MIT license and repository metadata required for distribution are approved and committed.
- [x] Complete iOS Simulator runtime acceptance and native release review.
- [x] Complete final release-candidate governance review.
- [x] Create the final tag and publish the repository release artifacts.
- [x] Complete the final 1.0 release review.

## Canonical commands

```bash
npm install
npm run runtime:verify
npm run runtime:test:web
npm run ios:verify
npm run release:verify
npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet
```

Native commands use a development client through `npm run runtime:ios` and `npm run runtime:android`; Expo Go is not part of the supported workflow. Generated demo service, auth, session-security, and linking adapters must be replaced before production use.
