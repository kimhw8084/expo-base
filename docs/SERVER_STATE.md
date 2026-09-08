# Server state

`@precision-calm/server-state` owns remote-data lifecycle. Product code supplies domain services,
query identity, mutation logic, and copy; it does not build caches, retry loops, race flags, or
optimistic rollback per route.

## Query keys

Use `precisionQueryKey` rather than concatenated strings:

```ts
const projectKeys = {
  all: precisionQueryKey.family('projects'),
  entity: (id: string) => precisionQueryKey.entity('projects', id),
  list: (filters: ProjectFilters) => precisionQueryKey.list('projects', filters),
  page: (page: number, filters: ProjectFilters) =>
    precisionQueryKey.page('projects', { page, pageSize: 25, filters }),
};
```

Keys accept serializable finite values. Object keys are sorted recursively, so equivalent filters
produce one identity. `family()` is the prefix for safe family invalidation. Cursor keys include
cursor, limit, and filters, leaving pagination/infinite-list composition open for Phase 6.
Authentication/session scope is added by the runtime; never put access tokens in a key.

## Queries

```tsx
const projects = usePrecisionQuery({
  key: projectKeys.list(filters),
  query: ({ signal }) => services.projects.list(filters, signal),
});
```

The `state` union is exhaustive:

- `disabled` — a dependent query is not enabled; cached data, if any, is explicit
- `initial-loading` — no usable data exists yet
- `error` — initial loading failed and no usable data exists
- `content` — usable data exists, with `freshness: fresh | stale` and refresh state
  `idle | refreshing | error`

`refresh()` cancels a superseded refetch where supported. Query loaders always receive an
`AbortSignal`; adapters may physically cancel, while the cache observer/key revision still prevents
late results from replacing a newer authoritative view when transport cancellation is unavailable.
Concurrent consumers of the same scoped key share one request.

The default is 30 seconds fresh, five minutes retained, and at most two adapter-approved transient
retries using bounded exponential backoff. Override `staleTimeMs` or `retry` only for a domain reason.
Automatic refocus/reconnect and persistence are disabled by default. A selected
`@precision-calm/runtime-capabilities` profile may opt into `PrecisionServerStateRuntimeBridge`
for deliberate active-query invalidation after reconnect/foreground; it does not imply offline
sync or cache persistence.

## Cache operations

`usePrecisionServerState()` exposes sanctioned operations without exposing TanStack internals:

- `invalidate(key, { exact, refetch })`
- `refetch(key)` and query-local `refresh()`
- `cancel(key)`
- `getData(key)`, `setData(key, updater)`, and `remove(key)`

Use an entity key for one record and `family()`/list prefixes for related results. Do not reach into
cache internals or create a route-local `Map`.

## Mutations

`usePrecisionAsyncAction` remains the owner for isolated actions that have no server-state cache
effects. Use `usePrecisionMutation` when an action updates or invalidates server state.

```tsx
const rename = usePrecisionMutation({
  mutation: ({ variables, signal }) => services.projects.rename(variables, signal),
  optimistic: ({ id, name }) => [
    precisionOptimisticUpdate(projectKeys.entity(id), (current) =>
      current ? { ...current, name } : { id, name },
    ),
  ],
  invalidate: [projectKeys.all],
});
```

The product opts into optimism; Expo Base cancels affected reads, snapshots cache values, applies
updates, rolls back failures/replacements, and invalidates after success (or after settlement when
requested). Outcomes are structured and non-throwing. Mutations do not retry unless given an
explicit bounded retry policy.

Concurrency is deliberate:

- `single-flight` (default) shares one in-flight promise for repeated triggers
- `queue` preserves write order
- `replace` aborts/suppresses the superseded write and its late commit
- `parallel` permits independent writes; optimistic updates are disallowed because rollback order
  would be ambiguous

## Errors and feedback

Service adapters throw `PrecisionServerError` with a safe kind/code/message and explicit
retryability. Backend response bodies and unknown exception messages do not cross into product UI.

Map query state into shared presentation with `toPrecisionAsyncState(state, itemCount)` and
`AsyncStateView`:

```tsx
const data = query.state.kind === 'content' ? query.state.data : [];
<AsyncStateView
  {...toPrecisionAsyncState(query.state, data.length)}
  onRetry={() => { void query.refresh(); }}
>
  <ProjectList projects={data} />
</AsyncStateView>
```

This produces initial loading/error/empty presentation, content plus refreshing feedback, and
content plus refresh-error feedback with a retry action. Products still own business wording and
empty-state meaning.

## Scope, static export, and future offline support

`PrecisionRuntimeProvider` mounts the query provider. Authenticated cache identity includes the
user ID and authoritative auth-session revision. Sign-out, user change, and session replacement
switch immediately to a fresh cache and clear the retired cache. Local lock retains the same cache
but protected routes are unavailable.

Clients are created inside providers, so Expo static rendering cannot share one user's cache with
another request. Cache persistence is off. Optional connectivity/lifecycle signals may be composed
at the root, but this architecture makes no offline guarantee and queues no offline mutations.

The canonical implementation is [`apps/reference/app/server-state.tsx`](../apps/reference/app/server-state.tsx).
The architecture rationale is [`ADR_SERVER_STATE.md`](./ADR_SERVER_STATE.md).
