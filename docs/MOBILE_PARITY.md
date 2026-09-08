# Mobile Parity Simulation Certification

Expo Base has a distinct browser certification lane for phone behavior. It uses Playwright device contexts rather than desktop pages resized to a narrow width.

Run the full lane with:

```sh
npm run mobile:verify
```

The lane performs a deterministic web export, starts an ephemeral static server, validates [`mobile.certification.json`](../mobile.certification.json), and runs the mobile Playwright matrix. `npm run mobile:web` runs the tests against an already-running exported app.

## Profiles

The matrix contains small, standard, and large portrait phone profiles plus a short-height landscape profile. Chromium provides the canonical mobile visual profile; Chromium and WebKit run the interaction lane. Profiles use Playwright device semantics (`isMobile`, touch, user agent, and DPR) and keep the matrix deliberately pairwise rather than multiplying every theme, locale, and density combination across every device.

Runtime controls add light/dark, comfortable/compact, pseudo LTR/RTL, and reduced-motion coverage inside representative tests. The mobile visual set is intentionally small and reviewable; baseline updates must use the same deliberate approval policy as Golden visual certification.

## Honest boundaries

The browser Unistyles runtime reports zero hardware safe-area insets. This lane does not inject CSS values and call them iPhone safe areas. Non-zero inset geometry remains protected by the shared layout and overlay solver contracts, including the existing property tests. The mobile browser lane therefore certifies composition under real device contexts and solver-level synthetic inset behavior, but not actual notch or home-indicator values. Mobile visual snapshots use explicit `darwin` and `linux` directories because system-font metrics differ across development and CI hosts; both reviewed baseline sets retain the same strict pixel-diff policy.

The keyboard tests reduce the browser viewport to a keyboard-sized usable region. They certify reachability, scrolling, sticky actions, and overlay containment only. They do not certify native keyboard-controller behavior.

## Certification categories

This phase can certify:

- mobile-browser touch and responsive behavior;
- mobile WebKit simulation;
- phone portrait/landscape composition;
- deterministic virtual-keyboard geometry stress;
- shared source contracts for safe-area, overlay, navigation, and form ownership.

It cannot certify:

- iOS or Android runtime execution;
- UIKit/native Modal behavior;
- actual Safari hardware safe-area values;
- native keyboard-controller behavior;
- VoiceOver or TalkBack;
- biometric and OS permission flows.
