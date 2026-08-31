# Service adapters

The core UI platform does not depend on Supabase, Firebase, REST, GraphQL, analytics vendors or image CDNs.

`@precision-calm/adapters` defines portable interfaces for auth, entity storage, key/value storage, analytics and image resolution. The package also includes deterministic memory/no-op implementations for reference applications and tests.

Production integrations should live in separate adapter packages, for example `@product/supabase-adapter`, and implement these interfaces. Design-system packages must never import those integrations.

## Runtime service injection

Application service implementations are composed once and injected through the root runtime:

```tsx
<PrecisionRuntimeProvider services={services}>
  <Stack />
</PrecisionRuntimeProvider>
```

Feature code can then call `usePrecisionServices()` from `@precision-calm/runtime`. This prevents screens from importing Supabase/Firebase/REST clients or application singletons directly, and allows tests/previews to inject deterministic adapters without changing product UI code.
