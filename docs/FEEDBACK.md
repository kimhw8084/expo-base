# Feedback and system states

Gate 11 makes loading and failure conditions part of the platform contract rather than ad-hoc product screens.

## Durable feedback

- `AlertBanner` for persistent informational, positive, warning, and negative conditions.
- `InlineMessage` for local section/form context.
- Critical errors are never toast-only.

## Loading

- `LoadingState` owns the raw React Native activity indicator and exposes progress semantics.
- `SkeletonLine` and `SkeletonList` provide content-shaped loading without feature-owned animation or geometry. Motion/shimmer is intentionally deferred to the motion gate so reduced-motion behavior is implemented once.

## State views

`StateView` supports empty, no-results, error, offline, permission, reconnect, and maintenance states with consistent icon, typography, spacing, and action hierarchy.

## Stale-content policy

`resolveAsyncState` preserves already-loaded content during refresh, offline, and refresh-error conditions. Instead of replacing useful content with a full-screen error, `AsyncStateView` retains it and adds a persistent degraded-state banner. Full empty/error/offline screens are used only when no usable content is available.
