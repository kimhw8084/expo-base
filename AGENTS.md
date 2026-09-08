# Expo Base agent contract

Expo Base is a semantic application foundation. Product code owns domain models, domain state,
copy, and unique visualizations. Shared packages own visual rules, responsive composition,
interaction semantics, accessibility mechanics, and infrastructure boundaries.

Start every feature with [the Golden Catalog](./docs/GOLDEN_CATALOG.md) and its machine-readable
source, [`golden.catalog.json`](./golden.catalog.json). The catalog is the sanctioned-owner index;
package documentation remains the detailed API reference.

## Ownership map

| Concern | Owner | Product-route role |
| --- | --- | --- |
| Tokens, theme, density, breakpoints, layers | `@precision-calm/tokens` | Consume through shared owners; do not recreate values. |
| Basic layout/text/interaction primitives | `@precision-calm/primitives` | Compose sparingly; prefer semantic components and layouts first. |
| Actions, cards, identity/status, code, labels, icons, disclosure | `@precision-calm/components`, `@precision-calm/icons` | Use semantic controls, not raw React Native controls. |
| Page, section, adaptive geometry, safe areas | `@precision-calm/layouts` | Choose a page/layout owner before writing a route. |
| Navigation and Expo Router integration | `@precision-calm/navigation`, `@precision-calm/navigation-router` | Use the router adapter; keep Router internals at the shell boundary. |
| Form fields and form composition | `@precision-calm/forms` | Use fields, sections, rows, actions, and `FormScreen`. |
| React Hook Form integration | `@precision-calm/form-rhf` | Use optional adapters; do not import RHF directly in a route. |
| Locale, messages, formatting, RTL direction | `@precision-calm/i18n`, runtime `i18n` | Configure once at the root; product applications own message catalogs. |
| Dialogs, sheets, popovers, menus, toasts | `@precision-calm/overlays` | Use the overlay owner; never build local modal/backdrop/focus behavior. |
| Motion and reduced-motion behavior | `@precision-calm/motion` | Use semantic shared motion; routes do not create timings or preference branches. |
| Loading, empty, error, offline, retry states | `@precision-calm/feedback` | Keep product copy/domain conditions, reuse shared state anatomy. |
| Rows, metrics, tables, timeline, selection, pagination, export serialization | `@precision-calm/data-display` | Use controlled data presentation owners. |
| Static, virtualized, and sectioned lists | `@precision-calm/lists` | Let the list own scrolling, refresh, and list states. |
| Image/media display | `@precision-calm/media-presentation` | Use `MediaFrame`; acquisition remains the selected optional media capability. |
| Charts and progress | `@precision-calm/visualization`; optional `@precision-calm/visualization-advanced` | Use core owners for ordinary plots; select the advanced module for scatter, histogram, or heatmap mechanics. Keep specialist visualizations product-specific or adapter-owned. |
| Runtime providers and async actions | `@precision-calm/runtime` | Consume services and `usePrecisionAsyncAction`; do not create global clients. |
| Server queries, cache, invalidation, and mutations | `@precision-calm/server-state` | Use deterministic keys and the shared scoped lifecycle; keep transport in services/adapters. |
| Backend-neutral service contracts | `@precision-calm/adapters` | Compose adapters outside feature routes. |
| Authentication and return intent | `@precision-calm/auth`, runtime auth | Use runtime hooks and protected routing. |
| Authorization | `@precision-calm/authorization`, runtime authorization | Ask for capabilities; never hardcode roles in a feature. |
| Local session lock | `@precision-calm/session-security` | Configure one adapter at the root; consume runtime state. |
| Optional device/platform capabilities | `@precision-calm/capabilities` plus selected capability packages | Register once at the root; consume the selected adapter in routes. |
| Secrets / ordinary preferences | `@precision-calm/secure-storage` / `@precision-calm/preferences` | Never fall back from secrets to ordinary or browser storage. |
| Connectivity / lifecycle | `@precision-calm/runtime-capabilities` | Consume signals; opt into query refetch policy deliberately. |
| Copy/share and copyable values, acquisition, local auth | `@precision-calm/sharing`, `@precision-calm/media`, `@precision-calm/local-auth` | Keep capability choice and permission rationale out of route infrastructure. |
| Notifications, updates, device, haptics | Selected optional Precision package | Device boundary only; backend/release policy stays product-owned. |
| Observability | `@precision-calm/observability` | Use provider-neutral root integration; never import a vendor SDK in a feature. |
| Golden workflow taxonomy and screen scaffolding | `golden.patterns.json`, `@precision-calm/patterns`, `@precision-calm/create-app` | Classify a standard route, then scaffold or manually compose its sanctioned pattern. |
| Living specification | `apps/reference` | Add a reference example when a shared capability changes. |
| Fresh-app parity | `@precision-calm/create-app` | Update generator and its test when a generated boundary changes. |

## Feature-route boundary

Feature routes express semantic structure, domain state/actions, and product content. They do not
casually own arbitrary spacing, dimensions, radii, colors, shadows, layers, breakpoints, platform
branches, keyboard/focus mechanics, overlay mechanics, loading/error/empty anatomy, networking,
or persistence.

| Do not do this | Use instead | Canonical starting point |
| --- | --- | --- |
| Raw color/spacing/radius/shadow/z-index or `StyleSheet.create` geometry | Tokens through `Page`, `Section`, `Card`, `Stack`, `Container`, and patterns | [layout engine](./docs/LAYOUT_ENGINE.md), `apps/reference/app/index.tsx` |
| Feature-owned fixed bottom action bar | `FormWorkspaceLayout` or `StickyActionBar` with `FormActions` | [Golden workflows](./docs/GOLDEN_WORKFLOWS.md#form-workspace), `apps/reference/app/forms.tsx` |
| Hand-authored width branches, `useWindowDimensions`, `Dimensions`, `window.innerWidth` | `AdaptiveGrid`, `AdaptiveSplit`, `MasterDetail`, `ResponsiveSlot`, adaptive navigation | [layout engine](./docs/LAYOUT_ENGINE.md), `apps/reference/app/navigation.tsx` |
| Raw `Pressable` | `Button`, `IconButton`, `Link`, `ListRow`, or a reviewed `PressableSurface` composition | [catalog: actions](./docs/GOLDEN_CATALOG.md#take-an-action) |
| Raw `TextInput`, `Switch`, select popup, date/time coercion, locale parser, OTP focus logic, keyboard controller, or `KeyboardAvoidingView` | Semantic forms (`NumberField`, `DateField`, `TimeField`, `DateRangeField`, `ComboboxField`, `CodeField`, groups), `FormScreen`, and form-RHF helpers | [forms](./docs/FORMS.md), `apps/reference/app/forms.tsx` |
| Local validation summary, server field-error mapper, dirty-leave prompt, or reset guard | `FormErrorSummary`, `FormDiscardDialog`, `useFormLeaveGuard`, and `usePrecisionFormLifecycle` for RHF | [forms](./docs/FORMS.md), `apps/reference/app/forms.tsx` |
| Raw `Modal`, portal, backdrop, measurement, or focus restoration | `Dialog`, `BottomSheet`, `Popover`, `Menu`, `ActionMenu`, `OverlayRootProvider` | [overlays](./docs/OVERLAYS.md), `apps/reference/app/overlays.tsx` |
| `Intl.*`, `localeCompare`, `toLocale*`, `I18nManager`, hard-coded `ltr`/`rtl`, or local pseudo-copy transforms | Runtime `i18n`, `usePrecisionI18n`, `usePrecisionDirection`, semantic start/end styles | [internationalization](./docs/INTERNATIONALIZATION.md), reference runtime controls |
| Local animation timing or reduced-motion branch | `MotionRootProvider`, `Reveal`, and shared feedback/overlay motion | [accessibility and motion](./docs/ACCESSIBILITY_MOTION.md), `apps/reference/app/accessibility-motion.tsx` |
| `Platform.OS`, `AppState`, SecureStore, AsyncStorage, Expo picker/media/notification/update/local-auth APIs, or vendor telemetry in a route | Selected Precision capability adapter registered through `PrecisionRuntimeProvider` | [runtime capabilities](./docs/RUNTIME_CAPABILITIES.md), [catalog: device capabilities](./docs/GOLDEN_CATALOG.md#use-an-optional-device-capability) |
| `fetch`, axios/ky clients, `AsyncStorage`, SecureStore, `localStorage` | Injected `AppServices`/adapters and runtime hooks; optional capabilities only when approved | [adapters](./docs/ADAPTERS.md), `apps/reference/app/services.tsx` |
| `useEffect` data loading, local cache/retry maps, direct TanStack imports, or hand-built optimistic rollback | `precisionQueryKey`, `usePrecisionQuery`, `usePrecisionMutation`, `usePrecisionServerState` | [server state](./docs/SERVER_STATE.md), `apps/reference/app/server-state.tsx` |
| Direct Expo Router/React Navigation use in a feature | `usePrecisionRouter`, `ProtectedRouterStack`, navigation components | [navigation](./docs/NAVIGATION.md), `apps/reference/app/navigation.tsx` |
| Local spinner/error/empty screen anatomy | `LoadingState`, `StateView`, `AsyncStateView`, `AlertBanner` | [feedback](./docs/FEEDBACK.md), `apps/reference/app/feedback.tsx` |
| Raw `Image` plus local loading/error shell | `MediaFrame`; selected `@precision-calm/media` only for acquisition | [media presentation](./docs/MEDIA_PRESENTATION.md), `apps/reference/app/system.tsx` |
| Local pagination/infinite state machine, custom timeline/avatar overlap, raw CSV quoting, or chart engine/colors | `CursorPagination`, `Timeline`, `AvatarGroup`, `serializeDelimitedData`, and visualization owners | [data display](./docs/DATA_DISPLAY.md), [visualization](./docs/VISUALIZATION.md) |
| Raw clipboard action, custom code surface, local sparkline/stacked SVG, or native date-picker import | Optional `CopyableValue`/`CopyableCode`, `CodeBlock`, Plus chart owners, and the documented picker adapter boundary | [components](./docs/COMPONENTS.md), [forms](./docs/FORMS.md), `apps/reference/app/golden-plus.tsx` |
| Role checks or direct auth adapter calls | `usePrecisionAuth`, `usePrecisionAuthorization`, protected routing | [auth](./docs/AUTH_PROTECTED_ROUTES.md), `apps/reference/app/auth-session.tsx` |

`golden-architecture.config.json` is the only exception mechanism for feature-boundary checks.
An exception must name narrow paths, rule IDs, and a concrete rationale. Do not add source comment
disables or broad global bypasses.

## Feature workflow

1. Classify the page/workflow in [`docs/GOLDEN_WORKFLOWS.md`](./docs/GOLDEN_WORKFLOWS.md) and search the Golden Catalog by intent.
2. For a scaffoldable standard route, run `npm run scaffold:screen -- --app apps/your-app --name route-name --pattern pattern-id`; otherwise manually compose the listed Golden owners.
3. Implement domain data, domain actions, and product copy around those owners.
4. Reuse feedback, form, navigation, overlay, and service boundaries rather than rebuilding them.
   Select existing media, data-scale, and visualization owners before adding product mechanics.
5. Introduce a shared primitive/composition only when it has product-neutral reuse and a clear owner.
6. Add focused behavior/contract coverage and a reference example when a shared owner changes.
7. Run `npm run check:golden-architecture` and the targeted package/generator checks.
8. Preserve full certification: typecheck, runtime verification, Doctor, generated-app parity, and web certification.

For shared visual, semantic, accessibility, or performance changes, run `npm run golden:verify`. Treat a visual diff as a defect until reviewed. Never update baselines as an automatic failure fix; the deliberate update policy lives in `docs/CERTIFICATION.md`.

For new reusable owners, update `golden.owner-certification.json` and link the owner to one Golden Catalog item. Use `npm run check:owner-certification`, `npm run check:dependency-graph`, and `npm run check:ultimate-audit`; advanced visualization belongs in `@precision-calm/visualization-advanced` and must not be pulled into the minimal generated app or reimplemented in a feature route. Run `npm run golden:verify` and `npm run mobile:verify` for shared visual or responsive changes.

Do not create a new page architecture when an existing Golden pattern matches the requested intent. Scaffolding is preferred for standard workflows; manual Golden composition remains valid for genuinely unique product work.

## Examples

Bad — route-owned geometry and platform branching:

```tsx
<View style={{ padding: 17, borderRadius: 9, backgroundColor: '#fff' }} />
const columns = Platform.OS === 'web' && window.innerWidth > 900 ? 3 : 1;
```

Good — semantic layout and adaptive composition:

```tsx
<Section>
  <AdaptiveGrid>{cards}</AdaptiveGrid>
</Section>
```

Bad — route-owned interaction and data infrastructure:

```tsx
const response = await fetch('/api/profile');
return <Modal><TextInput /><ActivityIndicator /></Modal>;
```

Good — shared state and interaction owners:

```tsx
const save = usePrecisionAsyncAction(() => services.profile.save(input));
return <Button label="Save" loading={save.state.status === 'loading'} onPress={() => { void save.run(); }} />;
// Use AsyncStateView for query presentation and Dialog + TextField for editing.
```

Bad — route-owned server state:

```tsx
useEffect(() => { fetch('/api/projects').then(setProjects); }, []);
const cache = new Map(); // local retries and optimistic rollback follow
```

Good — a service loader behind shared server-state ownership:

```tsx
const projects = usePrecisionQuery({
  key: precisionQueryKey.list('projects', filters),
  query: ({ signal }) => services.projects.list(filters, signal),
});
```

## Canonical documents

Use the catalog as the index. Keep detailed behavior in the existing canonical documents:
`LAYOUT_ENGINE.md`, `FORMS.md`, `FEEDBACK.md`, `DATA_DISPLAY.md`, `LISTS.md`,
`NAVIGATION.md`, `OVERLAYS.md`, `GOLDEN_PATTERNS.md`, `ADAPTERS.md`,
`ASYNC_INTERACTIONS.md`, `AUTH_PROTECTED_ROUTES.md`, `AUTHORIZATION_CAPABILITIES.md`,
`SESSION_SECURITY.md`, `INTERNATIONALIZATION.md`, `ACCESSIBILITY_MOTION.md`, and `VISUALIZATION.md`.
Shared interactive controls and media display are specified by `COMPONENTS.md` and
`MEDIA_PRESENTATION.md`.
Server queries and cache lifecycle are specified by `SERVER_STATE.md` and `ADR_SERVER_STATE.md`.
Optional native/browser boundaries, availability, permissions, privacy, and generator profiles are
specified by `RUNTIME_CAPABILITIES.md`. The visualization module boundary and current convergence
inventory are recorded in `ADR_VISUALIZATION_MODULE.md`, `ULTIMATE_GOLDEN_AUDIT.md`, and
`ULTIMATE_GOLDEN_COVERAGE.md`.

The audit remains historical and planning evidence in
[`docs/GOLDEN_TEMPLATE_AUDIT.md`](./docs/GOLDEN_TEMPLATE_AUDIT.md). Do not treat planned audit
capabilities as current APIs.
