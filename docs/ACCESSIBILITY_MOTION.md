# Motion and accessibility foundation

Gate 12 centralizes motion as progressive enhancement and accessibility behavior as a platform contract.

## Motion

- The reference app pins Expo SDK 57's recommended `react-native-reanimated` 4.5.1 and matching `react-native-worklets` 0.10.1.
- `MotionRootProvider` reads the system reduced-motion preference once and accepts a deterministic runtime override for reference/test accessibility modes.
- `Reveal` exposes only semantic fade/slide/scale transitions, uses Precision Calm motion durations, and disables decorative transitions under reduced motion.
- Dialogs, sheets, and toast progress consume the same policy: structural feedback remains visible while decorative animation is removed.
- Feature apps are blocked from importing Reanimated directly.
- Final geometry and information hierarchy must remain identical with animation disabled.

## Haptics

- Expo Haptics `~57.0.2` is isolated behind semantic `selection`, `confirm`, `warning`, `error`, and light `impact` intents.
- Haptic failures are swallowed because vibration is never required to complete or understand a workflow.
- Feature apps are blocked from importing Expo Haptics directly.

## Accessibility

- `LiveRegion` owns dynamic announcements. Android uses the native live-region/ARIA path; iOS performs a system accessibility announcement when the normalized message changes.
- `AccessibleGroup` centralizes composite labels and hints.
- `VisuallyHidden` provides screen-reader-only supporting content.
- Platform-neutral helpers normalize live messages and enforce zero duration under reduced motion.

React Native's current accessibility API supports live-region semantics and system accessibility announcements, while Reanimated 4.5 provides system-aware reduced-motion behavior across Android, iOS, and web.

### Universal semantic ownership

Reusable interactive primitives emit both React Native accessibility semantics and explicit `role` / `aria-*` state where the web runtime requires it. This keeps VoiceOver/TalkBack behavior owned by the native accessibility props while React Native Web receives deterministic DOM roles and states for buttons, links, tabs, menus, checkboxes, radios, switches, comboboxes, selected rows, and dismiss controls. Feature routes should consume these primitives rather than re-declaring platform-specific accessibility behavior.

### Content-size and keyboard resilience

Shared text and text-entry owners permit Dynamic Type/font scaling up to 200% (`maxFontSizeMultiplier={2}`), retain tokenized minimum touch targets, and let form actions stack in compact regimes. Text that has a deliberate compact truncation policy (for example navigation labels) declares it through its semantic owner; routes must not add fixed-height text shells to simulate a layout. Dialogs and sheets trap focus, provide modal semantics, and restore trigger focus safely after teardown.

New compound controls keep semantics with their owner: disclosure buttons expose expanded state;
segmented/radio/checkbox controls expose selected state and group errors; code input preserves a
single accessible verification-code purpose; media uses meaningful `alt` or explicit decoration;
and charts provide a textual summary and optional data table. Test long labels, RTL/pseudo locale,
compact width, dark mode, keyboard interaction, and reduced motion through the reference labs.

### Web certification

`PrecisionWebAccessibilityStyles` is installed by the reference app and app generator at the web document root. It preserves system focus indicators and non-color selected, expanded, invalid, and alert boundaries under forced-colors. Selective Playwright ARIA snapshots protect semantic hierarchy without snapshotting implementation-only DOM, while keyboard-only and zoom/RTL stress tests protect operability. See `docs/CERTIFICATION.md` and `golden.certification.json`.

Actual VoiceOver, TalkBack, Dynamic Type, physical touch-target, and native orientation acceptance remain native runtime checks; source contracts and web equivalence do not replace them.
