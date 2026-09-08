# Reconciled Gate 33 — session security

Gate 33 owns **local session lock state** independently from backend authentication and authorization.

## Boundary

- `@precision-calm/session-security` is platform-neutral. It defines the adapter contract and deterministic memory adapter used only by reference/tests.
- `PrecisionRuntimeProvider` accepts a `sessionSecurity` adapter and exposes `usePrecisionSessionSecurity()`.
- `PrecisionSessionSecurityBootstrap` keeps the navigator out of the tree until the first local-security resolution completes. This is required because Expo Router removes inactive `Stack.Protected` screens from history; protected cold-entry routes must never be registered and then invalidated during security bootstrap.
- `usePrecisionAuthAccess()` automatically consumes configured session-security state after bootstrap. A later revalidation is fail-closed as `booting`; adapter errors and explicit locks become `locked`.
- The router owns a dedicated `locked: ['unlock']` route. Protected product routes are not eligible while locked.
- Device-specific biometrics, secure persistence, lifecycle/AppState signals, and enterprise policy belong in replaceable adapter packages, not feature screens.

## Fail-closed behavior

During the first session-security resolution, `PrecisionSessionSecurityBootstrap` renders only the application bootstrap fallback and does not mount the protected navigator. This keeps protected content fail-closed **and** preserves the browser/native cold-entry URL because Expo Router never gets a false protected guard for that requested screen. After the first resolution, normal route guards own signed-out, error, and explicit-lock transitions. If local-security resolution fails, the runtime reports the stable error code `session_security_unavailable` and treats the session as locked. Raw adapter errors are never exposed to product UI.

## Reference acceptance flow

The reference app uses `MemorySessionSecurityAdapter` only so the contract can be exercised deterministically:

1. Open the Session Security acceptance route.
2. Choose **Lock session**.
3. Protected routes are removed from eligibility and the dedicated unlock route is shown.
4. Choose **Unlock**.
5. The adapter approves the request, the captured pre-lock route is consumed, and protected routing returns to that safe internal destination.

This proves the platform boundary and router integration. It does **not** certify biometrics or secure storage; those remain separate native/device work.
