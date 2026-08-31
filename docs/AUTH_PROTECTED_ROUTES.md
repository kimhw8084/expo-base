# Gate 35 — authentication session and protected routes

Precision Calm owns authentication resolution separately from backend identity providers and separately from local device re-lock.

## State model

Auth resolution is explicit:

- `loading` — session storage/provider has not resolved yet
- `signed-out` — provider confirmed there is no authenticated session
- `signed-in` — provider confirmed a session
- `error` — session restoration failed and protected information stays hidden

Navigation derives:

- `booting`
- `signed-out`
- `locked`
- `granted`
- `error`

A local session lock can only reduce `signed-in` to `locked`; it cannot turn loading, error, or signed-out into granted access.

## Protected route owner

Application layouts use `ProtectedRouterStack` from `@precision-calm/navigation-router`. Feature screens must not own `Stack.Protected`, redirects to `/sign-in`, or direct auth-adapter subscriptions.

During bootstrap only the session-loading route is eligible. This prevents a protected screen or sign-in screen from briefly flashing while secure session state is unresolved.

When a guard becomes false, Expo Router removes invalid route history. This is useful navigation behavior, but it is not backend authorization.

## Deep links and return intent

Gate 34 validates incoming links first. A shared `ReturnIntentChannel` may record the already-normalized internal route before Expo Router applies auth guards. The channel:

- is memory-only
- accepts same-app absolute paths only
- strips URL fragments
- rejects external and malformed paths
- can exclude auth callbacks, sign-in, recovery, and link-error routes
- is consumed once after successful sign-in

Web/client navigation also uses a best-effort current-path capture at the router boundary.

Never store OAuth callback codes/tokens as return intent. Exclude provider callback prefixes such as `/auth`.

## Device/session lock integration

Gate 33 can feed its lock state into the same access derivation without coupling the auth package to the device-security implementation:

```tsx
const access = usePrecisionAuthAccess({ locallyLocked: sessionSecurity.locked });

<ProtectedRouterStack
  access={access}
  routes={{
    always: ['link-error'],
    authenticated: ['(app)'],
    signedOut: ['sign-in'],
    booting: ['session-loading'],
    error: ['session-error'],
    locked: ['unlock'],
  }}
/>
```

If `access === 'locked'` without a configured locked route, `ProtectedRouterStack` fails explicitly rather than exposing another route accidentally.

## Security boundary

Protected routes are a client-side navigation/accessibility control. They do **not** replace server-side authorization, database row-level security, API authorization, or entitlement checks. Sensitive data must still be protected at the service/backend boundary.

## Error behavior

Raw auth-provider errors are not surfaced to screens. The runtime exposes stable safe error codes such as `session_unavailable` and `sign_in_failed`. Recovery UI uses fixed product copy.
