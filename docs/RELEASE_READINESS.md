# 1.0 release-readiness checklist

This document preserves the tagged Expo Base `v1.0.0` release evidence and records the qualified
current-main source baseline separately. Refreshing the source certification record does not create
a new tag, GitHub release, package publication, EAS deployment, or downstream-product release.

The repository is a public source/template workspace, not a configured multi-package npm
publication. The root MIT license governs the repository source; all 47 workspace packages remain
private, and any future package publication requires a separate package-release plan.

## Current-main source qualification

- Protected `main` provenance: `ea9ac98786ae60ee8c2a9e378455770d0bdac05e`, tree
  `5121ddd1b1b806a95386ca4f235afd0616d01233`.
- CHG-176 was integrated through PR #28. Accepted head
  `c28060f2710f706d60c3c9b4e4ec1ae2e48d3a7e` has the exact current-main tree. Full
  `npm run ios:verify` passed on that executable tree: 17 Release tests and 9 existing visual
  baselines on the iPhone 17 Pro / iOS 26.5 Simulator profile. The refreshed record carries this
  forward; it does not claim a new iOS execution or result bundle.
- Runtime Web run `35811032437` and Golden Certification run `35811032442` passed on the accepted
  head. The Golden workflow includes structural, mobile, and golden jobs. The candidate record
  retains `runtime-web`, `structural`, `mobile`, and `golden` as required hosted checks; protected
  integration reruns current hosted workflows for the candidate.
- CHG-175 R1 also passed `runtime:verify`, `runtime:test:web`, `golden:verify`, and `mobile:verify`
  before the CHG-176 harness-only repair. These remain earlier validation evidence, not new runs on
  the current-main tree.

The refreshed `release-candidate.certification.json` binds the final candidate's tracked source
tree using the repository algorithm, which excludes only that metadata file. `certifiedCommit`
records protected-main provenance; the source-tree hash identifies the candidate contents. The
record's `certifiedAt` is the governance-record refresh time, while native execution evidence remains
the CHG-176 run stated above. Passing local `npm run release:verify` validates deterministic
governance and source invariants; it does not replace the required hosted candidate checks or
declare a release.

## Development gates — complete

- [x] Shared architecture and package ownership are coherent.
- [x] Expo Base tokens, themes, density, layouts, and reusable compositions are contract-checked.
- [x] Forms, keyboard/focus behavior, overlays, navigation, feedback, data workflows, and async
  action ownership are hardened.
- [x] Auth, authorization, session security, linking, and service boundaries have stale-response and
  failure-path protection.
- [x] Reference-app showcase and generated-app foundation remain aligned.
- [x] Generator tests pass and a fresh generated application type-checks.
- [x] Expo Base Doctor passes with 94 checks, 0 failures, and 0 warnings.
- [x] Runtime UI typecheck and repository/package/API contracts pass.
- [x] Fresh static web export and Chromium/Firefox/WebKit certification pass: 385 passed / 2
  intentional skips.
- [x] Mobile-browser parity certification passes: 53 passed / 17 intentional visual-profile skips
  across touch Chromium and mobile WebKit contexts.
- [x] Certification server uses an OS-assigned port and deterministic cleanup.
- [x] Documentation, configuration, dependency, and repository-hygiene review is complete.
- [x] Release-candidate metadata is aligned to the coordinated `1.0.0` version plan.

## Tagged `v1.0.0` certification baseline

These items describe the immutable tagged baseline; current-main evidence is listed above.

- [x] Owner-approved MIT licensing and root `LICENSE`/manifest metadata are present.
- [x] iOS Simulator Release XCUITest acceptance: 17/17, with 9/9 reviewed native visual comparisons.
- [x] Three consecutive full native executions completed with zero retries and zero failures.
- [x] Semantic simulator selection and full Release CNG freshness are enforced by repository
  tooling.
- [x] Native release certification is pinned to Node 22.x (minimum 22.13.0) and records
  protected-main provenance without requiring historical PR objects.
- [x] Final PM authorization for the release commit, tag, and repository release execution is
  recorded by that release operation.

## Explicit support boundaries

- Android native certification remains deferred/waived and uncertified under Policy B after canceled
  CHG-149. No Android PASS or universal-native support is claimed.
- VoiceOver subjective human review was not executed. Dynamic Type audit coverage is simulator-limited
  on the installed iOS 26.5 runtime. Physical-device hardware, haptics, camera, biometrics, and
  device-specific safe-area behavior are not certified.
- Backend-integrated smoke validation is outside framework certification. Generated products must
  replace demo backend, authentication, session-security, and linking adapters with product-specific
  implementations; backend authorization remains product-owned.

## `v1.0.0` historical release facts

- [x] PM-approved release model is a private repository/template release; npm publication is not
  configured.
- [x] PM-approved coordinated `1.0.0` metadata and Expo/EAS semantic app version are applied.
- [x] PM-approved native build-number policy keeps native numbers owner-managed, monotonic, and
  independent of semantic version.
- [x] MIT license and repository metadata required for distribution are approved and committed.
- [x] Complete iOS Simulator runtime acceptance and native release review.
- [x] Complete final release-candidate governance review for the tagged `v1.0.0` baseline.
- [x] Create the `v1.0.0` tag; repository release publication remains outside this source-template
  checkout.
- [x] Complete the final 1.0 release review.

## Canonical commands

```bash
npm ci
npm run runtime:verify
npm run runtime:test:web
npm run ios:verify
npm run release:verify
npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet
```

Native commands use a development client through `npm run runtime:ios` and `npm run
runtime:android`; Expo Go is not part of the supported workflow.
