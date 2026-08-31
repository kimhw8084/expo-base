# Certification model

Precision Calm separates **contract-tested**, **runtime-tested**, and **production-certified** status so a green pure-logic test is never mistaken for a successful native/web build.

## Level A — contract-tested

Runs without external runtime dependencies and must pass before every merge:

- repository integrity
- architecture boundaries
- feature style/layout restrictions
- token/platform strict TypeScript
- responsive/overflow solvers
- forms/navigation/overlay/list/data/visualization/feedback/accessibility contracts
- golden-pattern identity checks
- certification matrix and geometry invariants
- generator scaffold tests
- public facade/API snapshot stability
- workspace version compatibility enforcement
- migration auditor regression tests
- 64-check generated/reference app doctor
- root service injection and backend-neutral service acceptance flow

Current restored-checkpoint command: `npm run quality:gate36`. Gate 34 certifies centralized external/deep-link policy; Gate 35 certifies authentication resolution/protected routing; Gate 36 certifies semantic capability authorization, fail-closed entitlement decisions, nested capability route guards, generator/Doctor wiring, and migration enforcement.

## Level B — runtime-tested

Requires installed dependencies and the reference application:

- full workspace TypeScript
- Expo Router/Metro startup
- static web export
- Chromium, Firefox, WebKit E2E
- screenshot/visual regression
- clean Expo prebuild
- iOS simulator critical flows
- Android emulator critical flows
- reduced-motion, keyboard, focus, safe-area and overlay interaction checks

## Level C — production-certified

Adds release-device and performance validation:

- representative physical iOS and Android devices
- cold/warm startup measurements
- list and chart stress performance
- memory regression review
- accessibility manual spot checks with VoiceOver/TalkBack
- upgrade compatibility report
- production build and deployment smoke test

A component or release must never be described as production-certified while only Level A has passed.

## Scenario matrix

The shared `@precision-calm/testing` package defines 252 deterministic combinations across:

- 9 representative viewports
- light/dark themes
- comfortable/compact density
- normal, long-text, large-number, empty, loading, error and offline content states

The same scenario definitions are intended to feed browser/native runtime runners once dependencies are installed.
