# Dependency baseline — 2026-09-06

Externally verified for the current scaffold:

- Expo `57.0.18`
- React Native `0.86.3` (Expo SDK 57 targets RN 0.86)
- React `19.2.3`
- React Native Web `0.21.0`
- Expo Router `57.0.17`
- react-native-unistyles `3.3.0`
- react-native-nitro-modules `0.36.5` (pinned; Unistyles 3.2+ documents a minimum of `0.35.2`)
- react-native-svg `15.15.4` (Expo current recommended version)
- lucide-react-native `1.37.0` (curated behind `@precision-calm/icons`)

Unistyles requires the New Architecture and Nitro Modules. Expo SDK 54+ already enables the edge-to-edge behavior that Unistyles recommends. The reference app sets `nativeBreakpointsMode: 'points'` so native responsiveness is based on logical screen points rather than raw pixels.

Before the first production native build, install dependencies and run a clean Expo prebuild in a networked development environment, then execute the full reference-app visual and native acceptance matrix. Dependency changes must remain exact/pinned until deliberately reviewed.

The versions above are the workspace compatibility source of truth and are currently deduplicated in the installed tree. Lockfile-based CI installs should use `npm ci`; native platform support and runtime validation remain separate release gates.
