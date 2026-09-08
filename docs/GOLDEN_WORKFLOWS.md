<!-- Generated from golden.patterns.json. Do not edit by hand; run npm run golden:patterns:write. -->

# Golden workflows

Start a product screen by choosing one of these composable workflow archetypes. The registry is
the source for the screen scaffolder; detailed page-layout behavior remains in [Golden page patterns](./GOLDEN_PATTERNS.md).

## New screen flow

1. Match the request to a pattern below.
2. Run `npm run scaffold:screen -- --app apps/your-app --name route-name --pattern pattern-id` when it is scaffoldable.
3. Replace only the explicit domain TODOs: models, service loader/mutation, copy, and unique visualization.
4. Run `npm run check:golden-architecture` and focused feature tests.

Scaffolded screens are one sanctioned route implementation; expert manual composition remains valid for unusual product workflows.

## Taxonomy

| Pattern | Use when | Shared owners | Server state | Form | Optional capabilities | Scaffold | Reference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `dashboard` | Build an operational or product overview. | `DashboardLayout`, `MetricGroup`, `AdaptiveSplit`, `Sparkline`, `AreaChart`, `StackedBarChart` | optional | none | — | manual composition | [/golden-plus](/golden-plus) |
| `activity-feed` | Show chronological activity, notifications, or an inbox. | `FeedListLayout`, `ListScreen`, `Timeline`, `AsyncStateView` | recommended | none | — | manual composition | [/golden-plus](/golden-plus) |
| `searchable-browse` | Browse or search a result collection with filters. | `SearchResultsLayout`, `DataToolbar`, `AsyncStateView` | recommended | none | — | manual composition | [/golden](/golden) |
| `data-workspace` | Build a protected searchable data workspace with retained stale data, filter drawer, pagination/infinite controls, and detail navigation. | `DataWorkspaceLayout`, `ServerStateContent`, `DataToolbar`, `FilterDrawer`, `CursorPagination`, `InfinitePagination`, `AdaptiveDataTable` | required | none | `runtime-signals` | yes | [/data](/data) |
| `detail` | Show one entity with contextual details and edit actions. | `DetailLayout`, `ServerStateContent`, `KeyValueList`, `StatusIndicator` | recommended | none | — | manual composition | [/golden-plus](/golden-plus) |
| `master-detail` | Show a collection and focused detail together on wide screens. | `MasterDetailPageLayout`, `MasterDetail` | recommended | none | — | manual composition | [/golden](/golden) |
| `settings-form` | Build account, profile, or settings forms with dirty protection and responsive actions. | `SettingsLayout`, `FormWorkspaceLayout`, `FormSectionGroup`, `usePrecisionFormLifecycle` | optional | required | `preferences` | yes | [/forms](/forms) |
| `form-workspace` | Create or edit a multi-section record. | `FormWorkspaceLayout`, `FormSectionGroup`, `FormErrorSummary`, `FormDiscardDialog` | recommended | required | — | yes | [/forms](/forms) |
| `wizard` | Guide a user through a bounded multi-step workflow. | `WizardLayout`, `FormWorkspaceLayout`, `StepIndicator`, `FormDiscardDialog` | optional | optional | — | manual composition | [/golden](/golden) |
| `authentication` | Build provider-neutral sign-in, recovery, verification, or unlock flows. | `AuthenticationLayout`, `usePrecisionAuth`, `PrecisionSessionSecurityBootstrap` | none | optional | `local-auth`, `secure-storage` | manual composition | [/sign-in](/sign-in) |
| `account-security` | Show account security state and local-unlock controls. | `ProfileLayout`, `usePrecisionSessionSecurity`, `PermissionRationaleLayout` | optional | optional | `local-auth`, `secure-storage` | manual composition | [/session-security](/session-security) |
| `onboarding` | Introduce a new user to a short, resumable setup workflow. | `WizardLayout`, `CompletionLayout` | optional | optional | — | manual composition | [/golden](/golden) |
| `review-approval` | Review a bounded change set before a destructive or consequential action. | `ReviewWorkflowLayout`, `FormDiscardDialog`, `Dialog` | optional | optional | — | yes | [/workflows](/workflows) |
| `import-workflow` | Select a document or media item, present selected media safely, validate it, and hand it to a product upload mutation. | `ImportWorkflowLayout`, `usePrecisionDocumentPicker`, `MediaFrame`, `usePrecisionMutation` | optional | optional | `media` | yes | [/workflows](/workflows) |
| `completion` | Hand a user off after successful completion. | `CompletionLayout`, `AlertBanner`, `FormActions` | none | none | — | yes | [/workflows](/workflows) |
| `permission-rationale` | Explain an optional capability before requesting it or opening settings. | `PermissionRationaleLayout`, `StateView`, `PrecisionCapabilityAvailability` | none | none | `media`, `notifications`, `local-auth` | yes | [/workflows](/workflows) |
| `offline-workspace` | Retain usable data while offline and offer explicit refresh after reconnect. | `OfflineWorkspaceLayout`, `ServerStateContent`, `PrecisionServerStateRuntimeBridge` | required | none | `runtime-signals` | yes | [/workflows](/workflows) |
| `unavailable` | Show maintenance or unavailable state without inventing an error screen. | `StateView`, `Page`, `Section` | none | none | — | manual composition | [/feedback](/feedback) |
| `overlay-workflow` | Complete a focused decision without losing underlying page context. | `OverlayWorkflowLayout`, `Dialog`, `BottomSheet` | optional | optional | — | manual composition | [/golden](/golden) |
| `command-launcher` | Expose a local, keyboard-first command surface with a mobile-safe dialog presentation. | `CommandLauncher`, `ActionMenu`, `Dialog` | none | none | — | manual composition | [/workflows](/workflows) |

## Boundaries

- Patterns own page hierarchy, responsive composition, shared state anatomy, action placement, and accessibility structure.
- Product code owns domain types, query keys/loaders, mutations, copy, authorization choices, and unique visualizations.
- A pattern never installs an optional capability; select it in the app capability profile before scaffolding a capability-aware workflow.
- Do not create a new page architecture when a listed Golden pattern already matches the request.
