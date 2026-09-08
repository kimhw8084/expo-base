# Async interactions

Expo Base keeps user-triggered asynchronous work at a shared lifecycle boundary.

Use `usePrecisionAsyncAction` only when the action has no query/cache effects. Remote reads and
writes that require identity, deduplication, stale data, invalidation, or optimistic bookkeeping
belong to `@precision-calm/server-state`; see [`SERVER_STATE.md`](./SERVER_STATE.md). These owners
are complementary, not competing mutation systems.

`usePrecisionAsyncAction` from `@precision-calm/runtime` is the canonical hook for feature-owned async actions. It exposes `idle`, `loading`, `success`, and `error` state, shares the in-flight promise when an action is invoked again before completion, and ignores late completion after reset or unmount. It does not pretend to cancel an adapter that has no cancellation contract.

Pass `state.status === 'loading'` to a shared `Button`'s `loading` prop. Button loading disables the press target, exposes busy/disabled semantics, and keeps the original label/icon footprint so feedback does not move surrounding layout.

Runtime-owned auth, capability, and session-security operations add revision checks at their adapter boundary. Subscription events and newer requests invalidate older completions. Product screens should use the runtime action status and handle success/error transitions without calling service adapters directly.

Retries should be explicit and idempotent. `StateView` accepts `actionLoading` for retry ownership,
while `AsyncStateView` retains usable content during refresh and presents degraded feedback with a
retry action instead of replacing it with a blank error state.
