# Expo Base 1.1.0 release-candidate governance

This document governs one independently auditable `v1.1.0` GitHub/source release candidate. It does
not authorize creating or pushing a tag, creating a GitHub Release, merging, moving protected
`main`, publishing npm packages, deploying EAS/store artifacts, or releasing downstream products.

## Version and compatibility classification

- Candidate version: `1.1.0` (SemVer minor from the released `1.0.0` baseline).
- Compatibility contract: application-facing APIs remain compatible within major version 1.
  Intentional breaking changes require a major migration path and are not included here.
- The delta adds standalone generated-repository acceptance, React Hook Form adapters, historical
  package-path compatibility, UI/runtime correctness hardening, and a non-destructive upgrade
  planner. See [the release notes](./RELEASE_NOTES_1.1.0.md) for the capability-level summary.

## Provenance and candidate identity

- Exact protected pre-release `main`: commit
  `9895d04052bb8aac98300d8d208f18614ae52b73`, tree
  `d804954a85da03553fdcae3ae98e86a5733acad9`.
- CHG-261 independently certified and integrated that source/framework baseline. It does not
  certify the `1.1.0` version metadata or native app semantic version.
- `release-candidate.certification.json` records the protected-main commit as provenance. Its
  `sourceTreeHash` identifies the actual tracked candidate contents and excludes only the record
  itself; it is the candidate identity used by `release:verify`.
- The candidate must be committed on its work branch with a clean worktree before
  `npm run release:verify` can pass. The record does not require an unavailable historical PR
  object and does not claim that protected `main` has moved.

## Coordinated release surface

The root Expo Base version, reference app package and Expo config version, private workspace package
versions, package-lock root/workspace versions, and generator-owned Expo Base package/provenance
versions move together to `1.1.0`. Dependency pins, compatibility versions, and internal wildcard
workspace dependency semantics remain unchanged. Generated product apps keep their own app version
and product-owned runtime integrations.

## Required candidate-bound evidence

Use Node `22.23.2`, `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`, Xcode `27.0`, and
the semantic iPhone 17 Pro / iOS 26.5 Simulator profile. Run `npm ci` followed by:

```text
npm run runtime:verify
npm run runtime:test:web
npm run golden:verify
npm run mobile:verify
npm run ios:verify
npm run test:generator
npm run test:migration-upgrade-plan
npm run test:migration-compatibility
npm run check:package-manifests
npm run check:public-api
npm run check:dependency-graph
npm run check:cng-freshness
npm run test:node-version-policy
npm run release:verify
```

Generator/standalone acceptance, migration and compatibility checks must pass. Migration audit
diagnostics caused by framework-owned platform branching are not a release Product gate. A real
Product/runtime or compatibility defect blocks this candidate. If the native environment is
unavailable, native evidence is blocked; stale runs cannot be substituted.

The certification record must state the actual native test and visual-baseline counts, Node/Xcode/
profile, required hosted-check names (`runtime-web`, `structural`, `mobile`, `golden`), zero open
P0/P1/P2 counts, and the final candidate source-tree hash. The named hosted checks are requirements,
not a claim that this work produced new hosted runs.

## Support boundaries

- Android native acceptance remains deferred/waived and uncertified for this candidate. The
  historical `v1.0.0` Policy B waiver is context only and is not new `v1.1.0` Android evidence.
  No Android PASS, TalkBack usability acceptance, or universal-native support is claimed.
- Human VoiceOver usability, exact real-device Dynamic Type behavior, and physical-device hardware
  behavior remain outside this candidate.
- npm publication, EAS/store deployment, and downstream-product production readiness remain outside
  this source-release candidate.
