# Gates 21–33 source reconciliation

This internal note records the historical source-continuity boundary behind the current repository. It is provenance, not a current roadmap or a substitute for the authoritative source and release checklist.

## Evidence rule

The current repository cannot prove a trustworthy gate-by-gate mapping for historical Gates 21–32. Those historical names are therefore not used as release requirements. The current source, contracts, generator, Doctor, and runtime certification are the authority for release review.

Gate 33 is represented in the current line by the platform-neutral session-security boundary and its runtime, generator, Doctor, and reference acceptance contracts.

## Current Gate 33 boundary

- `@precision-calm/session-security` owns the platform-neutral session-lock contract.
- `PrecisionRuntimeProvider` owns adapter injection.
- `usePrecisionSessionSecurity()` is the feature-facing session-lock runtime.
- `usePrecisionAuthAccess()` remains fail-closed while session security is loading, errored, or locked.
- The router owns the `locked: ['unlock']` route set.
- The reference app proves lock, protected-route removal, unlock, and safe return-intent restoration.
- The generator emits the same boundary for fresh apps, and Doctor enforces it.

## Current-source disposition of older clues

Older development notes mentioned areas such as Storybook, performance measurement, localization, privacy, connectivity, secure storage, and media. The current template intentionally exposes replaceable boundaries where present, but does not claim those as universal product features. They are not hidden release blockers for this frozen repository; product teams should evaluate them for their own application requirements.

## Historical runtime corrections retained

The generator and reference bootstrap now share the deterministic static-web theme contract:

- `unistyles.ts` uses deterministic web initialization.
- `app/+html.tsx` initializes Unistyles for static rendering.
- `ThemeRuntimeSync.tsx` synchronizes the system theme after mount.
- generated root layout mounts the theme synchronizer.
- generator tests and Doctor protect these invariants.

## Release-review disposition

Development is frozen. The non-native development gates are complete and certified. Native runtime acceptance, final license/version approval, and the final tag/publish decision remain separate release-review gates.
