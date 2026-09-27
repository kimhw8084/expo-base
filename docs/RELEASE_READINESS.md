# 1.0 release-readiness checklist

This document preserves the immutable tagged Expo Base `v1.0.0` release evidence and records the
qualified current-main source baseline separately. The current governance refresh does not create a
new tag, GitHub Release, npm publication, EAS/store deployment, or downstream-product release.

The repository is a public source/template workspace, not a configured multi-package npm
publication. The root MIT license governs the repository source; all 47 workspace packages remain
private, and any future package publication requires a separate package-release plan.

## Current-main source qualification

- Protected `main` provenance and executable source baseline: `0470d0edd4306e3134da5f1a15816793e1955352`,
  tree `665c2f82f9e04928d55eadd4d9d7de566eb998f1`, after CHG-186, CHG-187, and CHG-201.
- Runtime Web run `35949677933` succeeded on exact-current `main`. Golden Certification run
  `35949678010` succeeded on the same source for structural, mobile, and golden jobs.
- R4 current-source `npm run ios:verify` passed under Node `v22.23.2` and Xcode `27.0` on the
  iPhone 17 Pro / iOS 26.5 Simulator profile: 17 Release tests and 9 existing native visual
  baselines passed. The Release xcresult, summary, xcodebuild log, and visual evidence were present
  after execution. The exact tested `main` commit was the sole parent; there were zero source
  changes and the worktree was clean. Evidence:
  `refs/heads/codex-fabric/evidence/expo-base/chg261-ios-current-source-verify-r4@923d177831f5c17541b5155a5872bb101850c1f6:.codex-fabric/audit.json`.
- R5 consists of documentation and certification-metadata changes only. These are non-runtime
  governance changes; R4 did not execute the R5 documentation bytes. The refreshed record binds the
  final tracked candidate contents, excluding only that record. `npm run release:verify` checks this
  identity and release-governance contracts; it is not a new native or hosted execution.

The refreshed `release-candidate.certification.json` binds the final candidate's tracked contents
using the repository algorithm, which excludes only that metadata file. `certifiedCommit` records
protected-main provenance; the source-tree hash identifies the final candidate contents. The
record's `certifiedAt` is the governance-record refresh time, while native execution evidence remains
the R4 run stated above. Passing local `npm run release:verify` validates deterministic governance
and source invariants; it does not create a tag or publication or declare a release.

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

- Android native certification remains deferred/waived and uncertified after canceled CHG-149. No
  Android PASS, TalkBack usability acceptance, or universal-native support is claimed.
- VoiceOver subjective human review was not executed. Dynamic Type audit coverage is simulator-limited
  on the installed iOS 26.5 runtime. Physical-device behavior, including hardware, haptics, camera,
  biometrics, and device-specific safe-area behavior, is not certified.
- Npm publication and EAS/store deployment are not claimed. Backend-integrated smoke validation is
  outside framework certification. Generated products must provide product-specific backend,
  authentication, session-security, and linking adapters; downstream-product integrations remain
  product-owned.

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
