# Feedback and system states

Gate 11 makes loading and failure conditions part of the platform contract rather than ad-hoc product screens.

## Durable feedback

- `AlertBanner` owns persistent informational, positive, warning, and negative conditions.
- Banner copy and actions recompose vertically at compact widths instead of squeezing the message beside a control.
- `InlineMessage` is reserved for local section/form context.
- Critical errors are never toast-only.

## Loading

- `LoadingState` owns the raw React Native activity indicator and exposes one indeterminate progress semantic.
- `SkeletonLine` and `SkeletonList` provide content-shaped loading without feature-owned animation or geometry. `SkeletonList` exposes one named progress surface rather than announcing every decorative skeleton element.
- Loading and terminal state views share the `feedbackMetrics.stateMinHeight` rhythm so asynchronous content does not collapse into unrelated geometry while transitioning.
- Motion/shimmer remains centralized so reduced-motion behavior is implemented once.

## State views

`StateView` supports empty, no-results, error, offline, permission, reconnect, and maintenance states with consistent icon, typography, spacing, and action hierarchy.

- Error and connectivity states use semantic icon surfaces rather than a generic neutral tile.
- Copy is bounded to a readable measure.
- Primary/secondary actions become full-width and primary-first on compact layouts, then return to conventional secondary/primary desktop order.
- Error states expose alert semantics while informational empty states remain non-interruptive.

## Stale-content policy

`resolveAsyncState` preserves already-loaded content during refresh, offline, and refresh-error conditions. Instead of replacing useful content with a full-screen error, `AsyncStateView` retains it and adds a persistent degraded-state banner. When `onRetry` is supplied, a refresh-error banner owns the retry action without removing the content. Full empty/error/offline screens are used only when no usable content is available. Map `@precision-calm/server-state` query lifecycle with `toPrecisionAsyncState`; products still own business copy and empty-state meaning.
