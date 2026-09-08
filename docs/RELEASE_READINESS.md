# 1.0 release-readiness checklist

This checklist separates development completion from runtime validation and release decisions. It prepares the repository for review; it does not publish or tag Expo Base 1.0.

The current repository is a private source/template workspace, not a configured multi-package npm publication. All 31 workspace packages are private; any future package publication would require a separate package-release plan.

## Development gates — complete

- [x] Shared architecture and package ownership are coherent.
- [x] Precision Calm tokens, themes, density, layouts, and reusable compositions are contract-checked.
- [x] Forms, keyboard/focus behavior, overlays, navigation, feedback, data workflows, and async action ownership are hardened.
- [x] Auth, authorization, session security, linking, and service boundaries have stale-response and failure-path protection.
- [x] Reference-app showcase and generated-app foundation remain aligned.
- [x] Generator tests pass and a fresh generated application type-checks.
- [x] Expo Base Doctor passes with 86 checks, 0 failures, and 0 warnings.
- [x] Runtime UI typecheck and repository/package/API contracts pass.
- [x] Fresh static web export and Chromium/Firefox/WebKit certification pass: 180/180.
- [x] Certification server uses an OS-assigned port and deterministic cleanup.
- [x] Documentation, configuration, dependency, and repository-hygiene review is complete.
- [x] Release-candidate metadata is aligned to the coordinated `1.0.0` version plan.

## Pending before public `1.0.0`

- [ ] Obtain owner-approved licensing and add the approved `LICENSE`/manifest metadata.
- [ ] Execute the short iOS development-client acceptance matrix on a usable simulator or device.
- [ ] Obtain final PM authorization for the release commit, tag, and publication/distribution steps.

## Explicitly deferred or waived for `1.0.0`

- Android runtime execution is deferred/waived for `1.0.0` under PM Policy B because the local Android runtime is unavailable.
- Physical-device smoke validation and backend-integrated smoke validation remain product-adoption responsibilities, not claims made by this repository candidate.

## Release decision gates — pending approval

- [x] PM-approved release model is a private repository/template release; npm publication is not configured.
- [x] PM-approved coordinated `1.0.0` metadata and Expo/EAS semantic app version are applied.
- [x] PM-approved native build-number policy keeps native numbers owner-managed, monotonic, and independent of semantic version.
- [ ] Approve the license and repository metadata required for distribution.
- [ ] Complete iOS runtime acceptance and final release review.
- [ ] Create the final tag and publish the repository release artifacts.
- [ ] Complete the final 1.0 release review.

## Canonical commands

```bash
npm install
npm run runtime:verify
npm run runtime:test:web
npm run create:app -- --name "Orbit Ledger" --slug orbit-ledger --accent violet
```

Native commands use a development client through `npm run runtime:ios` and `npm run runtime:android`; Expo Go is not part of the supported workflow. Generated demo service, auth, session-security, and linking adapters must be replaced before production use.
