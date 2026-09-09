# Expo Base 1.0 release-candidate governance

This document defines the durable release-candidate boundary. It does not create a tag, publish a package, deploy an app, or migrate Ternavo.

## Identity

- Version: `1.0.0`
- Branch: `main`
- Source identity: the commit and tracked-source hash recorded in `release-candidate.certification.json`
- Native profile: semantic iPhone 17 Pro / iOS 26.5 / iOS Simulator
- Required hosted checks: `runtime-web`, `structural`, `mobile`, and `golden`

The certification record excludes only its own metadata file from the tracked-source hash. This prevents a metadata-only evidence commit from creating an impossible self-referential SHA loop while still binding the record to the executable source tree.

## Certified product surface

The protected baseline includes Runtime Web, Golden structural/semantic/visual/performance certification, responsive/mobile-browser parity, and iOS Simulator native certification. The native Release lane proves 17/17 XCUITest scenarios and 9/9 visual baselines. Full Release certification regenerates the ignored CNG native project with `expo prebuild --clean`; it never treats project-directory existence as freshness evidence.

Native visual comparison uses the reviewed profile-owned baselines with a per-channel tolerance of 3 and a differing-pixel ceiling of 0.2%. Baselines are never updated automatically.

## Boundaries

- Human VoiceOver usability traversal: not certified; use the documented manual checklist before a human-facing release if required.
- Exact Dynamic Type user-settings behavior: simulator-limited and not certified as a universal device guarantee.
- Physical device: not certified for haptics, camera fidelity, biometric authenticity, hardware permissions, or device-specific safe-area variants.
- Android native runtime: deferred/waived under Policy B.

These boundaries do not reopen the frozen product certification baseline.

## Commands

Run from the repository root:

```text
npm ci
npm run runtime:verify
npm run runtime:test:web
npm run golden:verify
npm run mobile:verify
npm run ios:verify
npm run release:verify
```

`ios:verify` is the expensive native certification entrypoint. `release:verify` checks the recorded certification, version/package contracts, source-tree identity, manifest, public API, dependency graph, generator boundaries, and repository cleanliness; it does not silently substitute a contract check for a native run.

## Release governance

`main` is protected by the active repository ruleset. Force pushes and branch deletion are blocked, pull requests are required, and the exact hosted checks above are required before merge. The native source SHA must be the SHA whose source tree passed `ios:verify`; metadata-only evidence commits are allowed only when the record's source-tree hash remains identical.

## Next phase

After governance passes, an operator may, as a separate deliberate action:

1. verify the exact release-candidate SHA and hosted checks;
2. preserve the native and web evidence summary;
3. create and push the project-approved signed/annotated `v1.0.0` tag;
4. create the GitHub Release;
5. begin downstream deployment or migration work only after the release artifact is approved.

Those actions are intentionally outside this phase.
