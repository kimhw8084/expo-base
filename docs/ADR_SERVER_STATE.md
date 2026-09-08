# ADR — Server-state implementation boundary

Status: accepted for Golden Phase 3  
Date: 2026-09-06

## Decision

Use Option C: `@precision-calm/server-state` is the application-facing facade and
`@tanstack/react-query` is its internal cache/query engine. Product routes do not import TanStack.
The facade is transport-neutral: a query is a deterministic key, an async loader that may consume
an `AbortSignal`, and explicit lifecycle policy. REST, GraphQL, Supabase, Firebase, tRPC, and other
clients remain behind product service adapters.

This is a meaningful facade, not a symbol-for-symbol rename. Expo Base owns scoped key factories,
the lifecycle union, structured safe errors, retry policy, invalidation/update operations,
mutation concurrency, optimistic snapshots/rollback, and feedback mapping. It deliberately does
not promise that arbitrary TanStack plugins or options can be swapped transparently.

## Options considered

- **A — Extend adapters plus `usePrecisionAsyncAction`: rejected.** It preserves the smallest
  bundle, but leaves request identity, cache lifetime, deduplication, invalidation, background
  refresh, and optimistic bookkeeping to every product.
- **B — First-party cache/query engine: rejected.** The apparent dependency saving would require
  Expo Base to maintain observers, garbage collection, cancellation, retries, deduplication, race
  behavior, and React concurrent-render integration already solved by a mature library.
- **C — Sanctioned integration facade: accepted.** TanStack Query 5 supports React 19, React
  Native, React DOM, SSR/static rendering, query cancellation signals, deterministic key hashing,
  and tested cache behavior. One focused package centralizes the policy and hides implementation
  imports from product routes.
- **D — Abstract facade plus swappable implementation: rejected for now.** A genuine provider
  interface would duplicate the observer and mutation contracts; a thin interface would leak
  TanStack details and provide false portability. A second implementation can justify that
  boundary later, but speculative interchangeability increases maintenance and weakens typing.

## Defaults and lifecycle boundary

- Data is fresh for 30 seconds and retained for five minutes after its last consumer. Products may
  override these policies for unusual data.
- Queries retry at most twice, and only when a service adapter returns a
  `PrecisionServerError` explicitly marked retryable. Authorization, validation, not-found,
  conflict, cancellation, and unknown failures do not retry automatically.
- Mutations never retry by default. They choose single-flight, queue, replace, or parallel
  concurrency deliberately; optimistic updates are forbidden with parallel execution because
  rollback order is ambiguous.
- Refocus/reconnect automation is off. Phase 4 may connect platform AppState/connectivity through
  a root adapter without changing feature queries.
- Cache persistence is off. A future opt-in adapter must define encryption/security, identity
  scope, schema migration, staleness, and startup cost before persistence is approved.
- `PrecisionRuntimeProvider` creates an isolated cache for public/auth-loading/signed-out/session
  scope. A user or authoritative session revision change mounts an empty client and clears the
  retired client, so prior-user data is never authoritative in a new session.
- Expo static export creates clients inside the application provider. No process-global query
  client or cross-request cache is used.

## Consequences

Generated apps gain one pure-JavaScript dependency and a standard provider through the runtime;
there is no native module or backend dependency. The integration is part of the Golden
application foundation, while connectivity and persistence remain optional future capabilities.
Direct TanStack imports in feature routes are structural architecture violations.
