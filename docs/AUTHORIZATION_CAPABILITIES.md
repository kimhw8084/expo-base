# Gate 36 — capability and entitlement authorization

Precision Calm separates **authentication** from **client capability gating**.

Authentication answers **who is signed in**. Authorization capabilities answer **which product experiences this authenticated identity should be able to see or invoke in the client**.

This layer is intentionally capability-oriented instead of role-oriented. Feature code should ask for semantic capabilities such as `reports.view`, `settings.manage`, or `rewards.optimize`, rather than coupling UI behavior to provider-specific roles such as `admin`, `premium`, or `employee`.

## Security boundary

Client capability checks are **UX and navigation controls only**. They do not authorize a server request, database row, storage object, or privileged mutation.

Every protected backend operation must independently enforce authorization using the backend's authoritative policy, such as API authorization, database row-level security, service permissions, or equivalent server-side controls.

A hidden button is not a security boundary.

## State model

Authorization is explicit and fail-closed:

- `inactive` — there is no authenticated identity to evaluate
- `loading` — capabilities for the current identity are unresolved
- `ready` — an authoritative client capability snapshot is available
- `error` — capability retrieval failed; protected capability UI remains unavailable

Only `ready` can produce an allowed decision.

## Capability requirements

Requirements support three semantic constraints:

```ts
{
  all: ['reports.view', 'reports.export'],
  any: ['billing.manage', 'billing.support'],
  none: ['account.suspended'],
}
```

- `all` — every listed capability must be present
- `any` — at least one listed capability must be present
- `none` — no listed capability may be present

Capability keys are normalized, deduplicated, validated, and bounded. Invalid requirements fail closed.

## Runtime ownership

`PrecisionAuthorizationProvider` binds the configured `AuthorizationAdapter` to the currently authenticated user. Product screens consume:

```tsx
const authorization = usePrecisionAuthorization();
const decision = usePrecisionAuthorizationRequirement({ all: ['reports.view'] });
```

or declaratively:

```tsx
<CapabilityGate
  requirement={{ all: ['reports.view'] }}
  fallback={<ReportsUnavailable />}
>
  <Reports />
</CapabilityGate>
```

Feature code must not call `services.authorization.getCapabilities()` directly. This keeps loading, refresh, subscription races, normalization, fail-closed behavior, and safe error handling consistent.

## Identity changes and race safety

Capabilities are scoped to the authenticated user ID. When identity changes, the previous capability snapshot is not reused for the new identity.

A slower `getCapabilities()` result cannot overwrite a newer subscription update. The runtime uses a revision contract before committing asynchronous fetch results.

Raw adapter/provider errors are not rendered to users. The runtime exposes the stable code `capabilities_unavailable` while keeping the capability decision denied.

## Protected routes

Capability-protected navigation is expressed as a nested authenticated guard through `ProtectedRouterStack`:

```tsx
const settings = usePrecisionAuthorizationRequirement({
  all: ['settings.manage'],
});

<ProtectedRouterStack
  access={authAccess}
  routes={routes}
  conditionalAuthenticated={[
    {
      key: 'settings-manage',
      guard: settings.allowed,
      screens: ['admin-demo'],
    },
  ]}
/>
```

The router adapter validates that a screen is not declared simultaneously in base and conditional groups. Capability guards are evaluated only inside the already-authenticated route group.

Again, this prevents invalid client navigation; it does not replace backend authorization.

## Adapter portability

The platform owns only this interface:

```ts
interface AuthorizationAdapter {
  getCapabilities(userId: string): Promise<readonly string[]>;
  subscribe?(
    userId: string,
    listener: (capabilities: readonly string[]) => void,
  ): () => void;
}
```

A product may implement it from Supabase, a REST API, GraphQL, Firebase, an entitlement service, an enterprise policy engine, or another source without changing UI modules.

Generated/demo applications use `MemoryAuthorizationAdapter`.

## Migration enforcement

The migration auditor flags feature code that:

- calls `services.authorization.*` directly
- performs hard-coded role comparisons such as `user.role === 'admin'`
- checks arbitrary role arrays in feature UI

Those patterns should be replaced with semantic capability requirements and backend enforcement at the service boundary.
