# Expo Base 1.1.0 release-candidate readiness

This document governs the `v1.1.0` source-release candidate and preserves the tagged `v1.0.0`
evidence below as history. Preparing this candidate does not authorize a tag, GitHub Release, npm
publication, EAS/store deployment, merge, move of `main`, or downstream-product release.

Expo Base is a source/template repository, not a configured multi-package npm publication. Workspace
packages remain private; any package publication requires a separate release plan.

## `v1.1.0` candidate lineage and scope

- Exact protected pre-release `main` provenance: commit
  `9895d04052bb8aac98300d8d208f18614ae52b73`, tree
  `d804954a85da03553fdcae3ae98e86a5733acad9`.
- CHG-261 independently certified and integrated the source/framework baseline at that provenance.
  The `v1.1.0` version and native app metadata are new candidate bytes, so CHG-261 evidence is not
  substituted for fresh candidate-bound gates.
- SemVer classification: minor. The `v1.0.0` to `v1.1.0` delta adds capabilities and compatibility
  support while retaining 1.x application-facing APIs. No intentional breaking change or major
  migration is part of this candidate.
- Coordinated version owners are the root Expo Base manifest, the reference app package and Expo
  config, private workspace packages, root/workspace package-lock entries, and generated Expo Base
  package/provenance metadata. Product apps' own starting version remains product-owned.
- `release-candidate.certification.json` records the protected-main provenance and the exact
  candidate source-tree hash separately. The hash excludes only the certification record itself.

## Candidate-bound evidence

Run under Node `22.23.2`, Xcode `27.0`, and the semantic iPhone 17 Pro / iOS 26.5 Simulator profile:

```text
npm ci
npm run runtime:verify
npm run runtime:test:web
npm run golden:verify
npm run mobile:verify
npm run ios:verify
npm run test:migration-upgrade-plan
npm run test:migration-compatibility
npm run test:generator
npm run check:package-manifests
npm run check:public-api
npm run check:dependency-graph
npm run check:cng-freshness
npm run test:node-version-policy
npm run release:verify
```

The certification record names the required hosted checks: `runtime-web`, `structural`, `mobile`,
and `golden`. Fresh local web, Golden, mobile, and iOS results are recorded as candidate evidence;
the record does not claim a new hosted workflow run. The iOS record must contain the actual fresh
native result and visual-baseline counts from the required profile. `release:verify` additionally
requires zero open P0/P1/P2 findings, current source-tree identity, clean worktree, CNG and manifest
checks, and API/dependency boundaries.

Android native acceptance remains deferred/waived and uncertified for this candidate. The historical
`v1.0.0` Policy B waiver is context only, not new `v1.1.0` Android evidence. No Android PASS,
TalkBack usability acceptance, or universal-native support is claimed. Human VoiceOver usability,
exact real-device Dynamic Type behavior, physical-device hardware behavior, npm publication,
EAS/store deployment, and downstream-product production readiness remain outside this candidate.

## Tagged `v1.0.0` certification baseline

These items describe the immutable tagged baseline; they do not certify the `v1.1.0` candidate.

- [x] Owner-approved MIT licensing and root `LICENSE`/manifest metadata are present.
- [x] iOS Simulator Release XCUITest acceptance: 17/17, with 9/9 reviewed native visual comparisons.
- [x] Three consecutive full native executions completed with zero retries and zero failures.
- [x] Semantic simulator selection and full Release CNG freshness are enforced by repository
  tooling.
- [x] Native release certification is pinned to Node 22.x (minimum 22.13.0) and records
  protected-main provenance without requiring historical PR objects.
- [x] Final PM authorization for the release commit, tag, and repository release execution is
  recorded by that release operation.

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

## Native and product support boundaries

- Android native certification remains deferred/waived and uncertified. The historical `v1.0.0`
  Policy B waiver is not new evidence for `v1.1.0`; no Android PASS, TalkBack usability acceptance,
  or universal-native support is claimed.
- VoiceOver subjective human review was not executed. Dynamic Type audit coverage is simulator-limited
  on the installed iOS 26.5 runtime. Physical-device behavior, including hardware, haptics, camera,
  biometrics, and device-specific safe-area behavior, is not certified.
- Npm publication and EAS/store deployment are not claimed. Backend-integrated smoke validation is
  outside framework certification. Generated products must provide product-specific backend,
  authentication, session-security, and linking adapters; downstream-product integrations remain
  product-owned.

## Canonical commands

```bash
npm ci
npm run runtime:verify
npm run runtime:test:web
npm run golden:verify
npm run mobile:verify
npm run ios:verify
npm run release:verify
npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet
```

Native commands use a development client through `npm run runtime:ios` and `npm run
runtime:android`; Expo Go is not part of the supported workflow.
