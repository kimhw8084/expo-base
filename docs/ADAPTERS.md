# Service adapters

The core UI platform does not depend on Supabase, Firebase, REST, GraphQL, analytics vendors or image CDNs.

`@precision-calm/adapters` defines portable interfaces for auth, entity storage, key/value storage, analytics and image resolution. The package also includes deterministic memory/no-op implementations for reference applications and tests.

Production integrations should live in separate adapter packages, for example `@product/supabase-adapter`, and implement these interfaces. Design-system packages must never import those integrations.

Native/browser capabilities are not `AppServices` defaults. Select and register them through
`@precision-calm/capabilities` and the relevant optional package at the application root; see
[`RUNTIME_CAPABILITIES.md`](./RUNTIME_CAPABILITIES.md). This keeps secure storage, media,
notifications, and vendor observability out of minimal applications and out of feature-route imports.

## Runtime service injection

Application service implementations are composed once and injected through the root runtime:

```tsx
<PrecisionRuntimeProvider services={services}>
  <Stack />
</PrecisionRuntimeProvider>
```

Feature code can then call `usePrecisionServices()` from `@precision-calm/runtime`. This prevents screens from importing Supabase/Firebase/REST clients or application singletons directly, and allows tests/previews to inject deterministic adapters without changing product UI code.

Services own transport and translate backend failures into presentation-safe `PrecisionServerError`
values. `@precision-calm/server-state` owns query identity, cache, retries, cancellation,
invalidation, and mutation bookkeeping around those service methods. A feature route should never
move REST, GraphQL, Supabase, Firebase, or another transport into its query function; see
[`SERVER_STATE.md`](./SERVER_STATE.md).
