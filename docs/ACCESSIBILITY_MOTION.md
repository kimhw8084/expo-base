# Motion and accessibility foundation

Gate 12 centralizes motion as progressive enhancement and accessibility behavior as a platform contract.

## Motion

- The reference app pins Expo SDK 57's recommended `react-native-reanimated` 4.5.1 and matching `react-native-worklets` 0.10.1.
- `MotionRootProvider` installs Reanimated's system reduced-motion policy globally.
- `Reveal` exposes only semantic fade/slide/scale transitions and uses Precision Calm motion durations.
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
