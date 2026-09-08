<!-- Generated from golden.catalog.json. Do not edit by hand; run npm run golden:catalog:write. -->

# Golden Catalog

Use this as the intent-first index for current Expo Base owners. It documents only usable
capabilities. The authoritative machine-readable source is [`golden.catalog.json`](../golden.catalog.json);
detailed API behavior remains in the linked package documents.

## Start by intent

| I need to… | Start with | Supporting owners |
| --- | --- | --- |
| build a settings form | `SettingsLayout, FormScreen, FormSection, FormActions` | `TextField, PasswordField, TextArea, SearchField, CurrencyField`; `FormField, FormSection, FormSectionGroup, FormRow, FormActions`; `usePrecisionForm, controlled field adapters, keyboard flow, error focus`; `FormErrorSummary, FormDiscardDialog, useFormLeaveGuard`; `usePrecisionFormLifecycle, usePrecisionFormErrorSummary, applyPrecisionFormServerErrors` |
| build a searchable data screen | `DataWorkspaceLayout, DataToolbar, AdaptiveDataTable, SelectionBar` | `SearchResultsLayout, ListScreen, StateView`; `AdaptiveDataTable, DataToolbar, SelectionBar, Pagination`; `AsyncStateView, StateView, AlertBanner` |
| show a loading/error/retry state | `AsyncStateView, StateView, AlertBanner` | `LoadingState, SkeletonLine, SkeletonList, InlineMessage` |
| open a destructive confirmation | `Dialog` | `Button, IconButton, Link, ListRow` |
| perform an async action | `usePrecisionAsyncAction` | `PrecisionRuntimeProvider, usePrecisionServices, AppServices adapters`; `AsyncStateView, StateView, AlertBanner` |
| add a responsive page header | `Screen, ScrollScreen, FormScreen, Page, Container` | `Section, SectionHeader, PageHeader, Toolbar`; `AdaptiveGrid, AdaptiveSplit, MasterDetail, ResponsiveSlot, SidebarLayout` |
| format or localize content | `PrecisionRuntimeProvider i18n, usePrecisionI18n, usePrecisionDirection` | — |
| load server data | `precisionQueryKey, usePrecisionQuery` | `PrecisionRuntimeProvider, usePrecisionServices, AppServices adapters`; `toPrecisionAsyncState, AsyncStateView` |
| refresh server data | `usePrecisionServerState, query.refresh` | `toPrecisionAsyncState, AsyncStateView` |
| mutate server data | `usePrecisionMutation` | `PrecisionRuntimeProvider, usePrecisionServices, AppServices adapters`; `Button, IconButton, Link, ListRow` |
| invalidate cached data | `usePrecisionServerState, query.refresh` | `precisionQueryKey, usePrecisionQuery` |
| perform an optimistic update | `precisionOptimisticUpdate, usePrecisionMutation` | `usePrecisionMutation` |
| render stale data safely | `toPrecisionAsyncState, AsyncStateView` | `AsyncStateView, StateView, AlertBanner`; `precisionQueryKey, usePrecisionQuery` |
| store a secret | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoSecureStorage, usePrecisionSecureStorage` |
| save a user preference | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `DevicePreferences, usePrecisionPreferences` |
| respond to connectivity | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoConnectivity, ReactNativeAppLifecycle, PrecisionServerStateRuntimeBridge`; `usePrecisionServerState, query.refresh` |
| share content | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoClipboard, ExpoSharing, usePrecisionClipboard, usePrecisionSharing` |
| select a document | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoDocumentPicker, ExpoMediaAcquisition, usePrecisionDocumentPicker, usePrecisionMediaAcquisition` |
| request camera or media | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoDocumentPicker, ExpoMediaAcquisition, usePrecisionDocumentPicker, usePrecisionMediaAcquisition` |
| unlock with biometrics | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoLocalAuthentication, LocalAuthenticationSessionSecurityAdapter`; `PrecisionSessionSecurityBootstrap, usePrecisionSessionSecurity` |
| add push-notification support | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoNotifications, usePrecisionNotifications` |
| check for an app update | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `ExpoUpdates, usePrecisionUpdates` |
| report an error | `createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities` | `NoopObservability, RecordingObservability, usePrecisionObservability` |
| scaffold a Golden screen | `scaffold-precision-screen` | `FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout` |
| build a protected searchable customer workspace | `scaffold-precision-screen` | `DataWorkspaceLayout, DataToolbar, AdaptiveDataTable, SelectionBar`; `ServerStateContent`; `precisionQueryKey, usePrecisionQuery` |
| build an account settings workflow | `scaffold-precision-screen` | `SettingsLayout, FormScreen, FormSection, FormActions`; `FormErrorSummary, FormDiscardDialog, useFormLeaveGuard`; `FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout` |
| build an import workflow | `scaffold-precision-screen` | `FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout`; `ExpoDocumentPicker, ExpoMediaAcquisition, usePrecisionDocumentPicker, usePrecisionMediaAcquisition`; `usePrecisionMutation` |
| build an offline-aware workspace | `scaffold-precision-screen` | `FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout`; `ExpoConnectivity, ReactNativeAppLifecycle, PrecisionServerStateRuntimeBridge`; `ServerStateContent` |
| open a command launcher | `CommandLauncher` | `Dialog` |
| reveal supporting content | `Disclosure, Accordion, SegmentedControl, StepIndicator` | — |
| enter currency | `EmailField, UrlField, PhoneField, NumberField, CurrencyField, NumberStepper` | `PrecisionRuntimeProvider i18n, usePrecisionI18n, usePrecisionDirection` |
| choose from a searchable list | `ComboboxField, MultiSelectField` | `Popover, Menu, ActionMenu` |
| collect a verification code | `CodeField` | `usePrecisionAuth, usePrecisionAuthAccess, ProtectedRouterStack` |
| add repeatable form items | `usePrecisionFieldArray, usePrecisionConditionalField, createPrecisionAsyncValidator, usePrecisionAutosave` | `usePrecisionFormLifecycle, usePrecisionFormErrorSummary, applyPrecisionFormServerErrors` |
| paginate or scale a dataset | `CursorPagination, InfinitePagination, useDataColumnVisibility, ListScreen, SectionListScreen` | `precisionQueryKey, usePrecisionQuery` |
| build a filter-heavy browse screen | `FilterDrawer, DataToolbar` | `DataWorkspaceLayout, DataToolbar, AdaptiveDataTable, SelectionBar` |
| show media with loading or error | `MediaFrame` | — |
| show a trend chart | `ChartFrame, LineChart, BarChart, DonutChart, ChartLegend, ChartDataTable` | — |
| add a secure biometric unlock screen | `FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout` | `PrecisionSessionSecurityBootstrap, usePrecisionSessionSecurity`; `ExpoSecureStorage, usePrecisionSecureStorage`; `ExpoLocalAuthentication, LocalAuthenticationSessionSecurityAdapter` |
| add a paginated searchable workspace | `DataWorkspaceLayout, DataToolbar, AdaptiveDataTable, SelectionBar` | `CursorPagination, InfinitePagination, useDataColumnVisibility, ListScreen, SectionListScreen`; `precisionQueryKey, usePrecisionQuery` |
| add a form with async validation | `usePrecisionFieldArray, usePrecisionConditionalField, createPrecisionAsyncValidator, usePrecisionAutosave` | `usePrecisionFormLifecycle, usePrecisionFormErrorSummary, applyPrecisionFormServerErrors` |
| show a chart with accessible fallback | `ChartFrame, LineChart, BarChart, DonutChart, ChartLegend, ChartDataTable` | `LiveRegion, AccessibleGroup, VisuallyHidden` |
| add document import | `FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout` | `ExpoDocumentPicker, ExpoMediaAcquisition, usePrecisionDocumentPicker, usePrecisionMediaAcquisition`; `usePrecisionMutation` |
| show stale server data while refreshing | `ServerStateContent` | `toPrecisionAsyncState, AsyncStateView`; `AsyncStateView, StateView, AlertBanner` |
| build a settings page | `SettingsLayout, FormScreen, FormSection, FormActions` | `FormErrorSummary, FormDiscardDialog, useFormLeaveGuard`; `DevicePreferences, usePrecisionPreferences` |
| add a command launcher | `CommandLauncher` | `Dialog` |
| show explanatory hover or focus help | `Disclosure, Accordion, SegmentedControl, StepIndicator` | — |
| show a copyable identifier | `CopyButton, CopyableValue, CopyableCode` | `ExpoClipboard, ExpoSharing, usePrecisionClipboard, usePrecisionSharing` |
| show code or configuration text | `CodeBlock` | — |
| show a semantic status | `Avatar, AvatarGroup, StatusIndicator` | — |
| show user avatars | `Avatar, AvatarGroup, StatusIndicator` | `MediaFrame` |
| show event history | `Timeline` | — |
| collect a date or time | `DateField, TimeField, DateRangeField` | `PrecisionRuntimeProvider i18n, usePrecisionI18n, usePrecisionDirection` |
| show a compact trend | `AreaChart, StackedBarChart, Sparkline, ChartSeriesDataTable` | — |
| show stacked series | `AreaChart, StackedBarChart, Sparkline, ChartSeriesDataTable` | — |

## Available current owners

### Build a Page

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Screen, ScrollScreen, FormScreen, Page, Container | Starting any route or full-screen product surface. | A dialog, bottom sheet, or list already owns scrolling. | `@precision-calm/ui` |
| Section, SectionHeader, PageHeader, Toolbar | A page needs a title, metadata, section grouping, or page-level actions. | A Golden pattern already supplies the same header/section anatomy. | `@precision-calm/ui` |
| DashboardLayout, MetricGroup, Metric, Card | Starting a dashboard or operational home route. | The page is primarily a table, feed, detail, or form. | `@precision-calm/ui` |

### Build a Responsive Page

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| AdaptiveGrid, AdaptiveSplit, MasterDetail, ResponsiveSlot, SidebarLayout | A product surface changes structure across shared responsive regimes. | The distinction is only content; keep one semantic composition instead. | `@precision-calm/ui` |

### Build a Settings Form

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| SettingsLayout, FormScreen, FormSection, FormActions | Editing product preferences, account settings, or a small grouped form. | The workflow is multi-step; start with WizardLayout instead. | `@precision-calm/ui` |

### Build a Searchable Data Screen

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| DataWorkspaceLayout, DataToolbar, AdaptiveDataTable, SelectionBar | Displaying an ordinary controlled dataset with filters, row actions, or bulk actions. | The dataset needs very large table virtualization; remote data should be supplied through @precision-calm/server-state without moving cache ownership into the table. | `@precision-calm/ui` |
| SearchResultsLayout, ListScreen, StateView | Search results, browse pages, or a result list with a domain-owned query input. | A dense workspace/table is the primary content; use DataWorkspaceLayout. | `@precision-calm/ui` |

### Build a Form

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| TextField, PasswordField, TextArea, SearchField, CurrencyField | Collecting the currently supported text/password/search/currency input. | A product needs searchable choice, date/time/range, OTP, or file/media input; use the corresponding specialized Golden owner. | `@precision-calm/ui` |
| SelectField, Checkbox, RadioGroup, SwitchField | Selecting static options or a boolean value. | The product needs autocomplete, multi-select, grouped checkbox errors, or segmented selection. | `@precision-calm/ui` |
| FormField, FormSection, FormSectionGroup, FormRow, FormActions | A form has multiple fields, sections, help text, or submission actions. | A one-control action is already fully represented by its component. | `@precision-calm/ui` |
| usePrecisionForm, controlled field adapters, keyboard flow, error focus | A product has chosen React Hook Form for an existing supported field flow. | Creating a form state abstraction or importing react-hook-form directly in a route. | `@precision-calm/form-rhf` |
| FormErrorSummary, FormDiscardDialog, useFormLeaveGuard | A supported form needs server validation feedback, a focusable error summary, reset, or unsaved-change protection. | Persisting drafts, building offline autosave, or inventing a route-specific navigation guard; those require later server-state or optional storage boundaries. | `@precision-calm/ui` |
| usePrecisionFormLifecycle, usePrecisionFormErrorSummary, applyPrecisionFormServerErrors | A product has chosen React Hook Form and needs the supported shared form lifecycle. | Persisting drafts, implementing autosave, arrays, or dependent-field orchestration; those remain later capabilities. | `@precision-calm/form-rhf` |
| CheckboxGroup, RadioGroup, SwitchField, SegmentedField | A form collects one or more bounded choices, including an error or required state. | Choices require search or are a repeatable domain record array. | `@precision-calm/ui` |

### Format or Localize Content

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| PrecisionRuntimeProvider i18n, usePrecisionI18n, usePrecisionDirection | Displaying product copy through message IDs, formatting values, sorting user-visible strings, or responding to locale direction. | Adding a translation vendor, provider-specific translation workflow, or product catalog to the shared kernel. | `@precision-calm/ui` |

### Show Loading Error Retry

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| AsyncStateView, StateView, AlertBanner | A route or section has product-owned asynchronous state and needs standard feedback anatomy. | A bare action is loading; use Button loading or LoadingState instead. | `@precision-calm/ui` |
| LoadingState, SkeletonLine, SkeletonList, InlineMessage | Loading a page, list, card, or presenting a compact non-blocking message. | The state needs a full empty/error/retry action; use StateView or AsyncStateView. | `@precision-calm/ui` |

### Open a Destructive Confirmation

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Dialog | Confirming a consequential or destructive product action. | Choosing from a small action list; use ActionMenu or Menu. | `@precision-calm/ui` |

### Open an Overlay

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| BottomSheet | A mobile-friendly contextual workflow or long overlay is appropriate. | A full route or destructive confirmation provides clearer navigation semantics. | `@precision-calm/ui` |

### Create an Action Menu

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Popover, Menu, ActionMenu | Offering contextual actions or a small anchored menu. | The option requires searchable/autocomplete input; that control is not current. | `@precision-calm/ui` |

### Take an Action

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Button, IconButton, Link, ListRow | An action maps to a button, icon action, link, or selectable row. | The interaction needs a new product-neutral semantic owner; propose it first. | `@precision-calm/ui` |

### Present Content

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Card, Avatar, Badge, Tag, Icon, Text | A product needs normal content hierarchy or a status surface. | The content is media/image, code, avatar group, or timeline; those are not current shared owners. | `@precision-calm/ui` |

### Add a Responsive Navigation Shell

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| AdaptiveNavigationShell, SidebarNavigation, BottomNavigation, Tabs, Breadcrumbs | Composing application navigation at a shell or page-context boundary. | Implementing route resolution or direct Expo Router calls; use the router adapter. | `@precision-calm/ui` |

### Protect or Navigate a Route

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| usePrecisionRouter, ProtectedRouterStack, useCaptureReturnIntent | Navigating from a feature or configuring the application root route boundary. | Importing expo-router or React Navigation directly in a feature. | `@precision-calm/navigation-router` |
| usePrecisionAuth, usePrecisionAuthAccess, ProtectedRouterStack | Showing auth state, signing in/out, or configuring protected routes at the root. | Implementing provider-specific enrollment, OAuth, recovery, MFA, or backend authorization policy. | `@precision-calm/runtime` |

### Display a Dataset

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| AdaptiveDataTable, DataToolbar, SelectionBar, Pagination | Displaying a moderate structured dataset with product-owned rows and action handlers. | The table requires remote cache ownership, 10k-row virtualization, pinning, or column persistence. | `@precision-calm/ui` |

### Display a List

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ListScreen, SectionListScreen, StaticList | Displaying a long or grouped sequence of domain items. | A plain small static group can be composed with ListRow, or remote cache behavior is required. | `@precision-calm/ui` |

### Display an Entity Detail

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| DetailLayout, KeyValueList, ListRow, Metric | Showing an entity or record detail screen. | The product requires copy/export/share affordances; those remain incomplete. | `@precision-calm/ui` |

### Add Accessible Status or Hidden Copy

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| LiveRegion, AccessibleGroup, VisuallyHidden | A product-specific state change needs an explicit accessible announcement beyond an existing owner. | A form, feedback, navigation, or overlay owner already provides the required semantics. | `@precision-calm/ui` |

### Load Server Data

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| precisionQueryKey, usePrecisionQuery | A route reads remote or asynchronous authoritative data through a product service adapter. | The work is one isolated user action with no cached server state; use usePrecisionAsyncAction. | `@precision-calm/server-state` |

### Refresh or Invalidate Server Data

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| usePrecisionServerState, query.refresh | Product logic knows cached data is stale or a successful domain action affects related query identities. | A component merely wants to re-render local state or reach into a third-party QueryClient. | `@precision-calm/server-state` |

### Mutate Server Data

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| usePrecisionMutation | A user action changes authoritative server data or must coordinate query cache state. | The action has no query/cache effects; use usePrecisionAsyncAction for the smaller lifecycle. | `@precision-calm/server-state` |

### Perform an Optimistic Update

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| precisionOptimisticUpdate, usePrecisionMutation | A domain mutation is safe to represent immediately and has a deterministic rollback. | The domain cannot safely predict success, or concurrent optimistic writes have ambiguous ordering. | `@precision-calm/server-state` |

### Render Stale Data Safely

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| toPrecisionAsyncState, AsyncStateView | Rendering a query through shared feedback anatomy while keeping business wording product-owned. | The state is a mutation-only action; use Button loading and mutation outcome feedback. | `@precision-calm/server-state` |

### Perform an Async Action

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| usePrecisionAsyncAction | Submitting, saving, deleting, or retrying one action through an injected service. | Managing server-state queries, caching, invalidation, optimistic updates, or offline persistence. | `@precision-calm/runtime` |

### Use Runtime or Platform Services

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| PrecisionRuntimeProvider, usePrecisionServices, AppServices adapters | A route needs an approved backend-neutral adapter or service action. | Calling fetch, a vendor client, storage, or device API directly in a route. | `@precision-calm/runtime` |

### Gate a Capability

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| usePrecisionAuthorization, usePrecisionAuthorizationRequirement, CapabilityGate | Conditionally revealing an action or route after auth is ready. | Hardcoding roles or assuming client checks replace backend enforcement. | `@precision-calm/runtime` |

### Protect a Local Session

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| PrecisionSessionSecurityBootstrap, usePrecisionSessionSecurity | Configuring or consuming local session lock state. | Calling biometrics or secure storage directly in a feature route. | `@precision-calm/runtime` |

### Handle a Link

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| createPrecisionLinkingRuntime, ExpoExternalNavigationAdapter | Configuring external/incoming linking at the application integration boundary. | Using raw Linking or accepting unvalidated URLs in a feature route. | `@precision-calm/linking` |

### Configure Optional Device Capabilities

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| createPrecisionCapabilityRegistry, PrecisionRuntimeProvider capabilities | An application opts into one or more supported device/browser capabilities. | A product is adding a backend vendor, remote-config vendor, or domain service; keep those integrations product-owned. | `@precision-calm/capabilities` |

### Store a Secret

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoSecureStorage, usePrecisionSecureStorage | A root-composed session/auth or product integration needs device secret persistence. | Saving theme, locale, density, or ordinary preferences; use preferences instead. | `@precision-calm/secure-storage` |

### Save a User Preference

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| DevicePreferences, usePrecisionPreferences | Persisting a local theme, density, locale, or product preference that is not a server-synced setting. | Persisting secrets, authorization state, or product domain records. | `@precision-calm/preferences` |

### Respond to Connectivity or Lifecycle

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoConnectivity, ReactNativeAppLifecycle, PrecisionServerStateRuntimeBridge | A product needs an honest online/offline signal or consciously chooses reconnect/foreground refresh policy. | Building offline synchronization, persisted cache, or a route-local AppState listener. | `@precision-calm/runtime-capabilities` |

### Copy or Share Content

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoClipboard, ExpoSharing, usePrecisionClipboard, usePrecisionSharing | Copying a meaningful value or invoking an OS/browser share sheet. | Exporting a generated document or implementing product-specific sharing metadata/backend URLs. | `@precision-calm/sharing` |

### Select a Document or Media

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoDocumentPicker, ExpoMediaAcquisition, usePrecisionDocumentPicker, usePrecisionMediaAcquisition | A product needs user-selected input before its own upload/storage workflow. | Rendering media, uploading to a backend, or inventing a feature-local permission lifecycle. | `@precision-calm/media` |

### Unlock With Biometrics

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoLocalAuthentication, LocalAuthenticationSessionSecurityAdapter | Unlocking a locally protected session or approving a local protected action. | Authenticating with a backend, authorizing a server request, or replacing product auth enrollment. | `@precision-calm/local-auth` |

### Add Push Notification Support

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoNotifications, usePrecisionNotifications | A product has deliberately selected a push backend and needs the device capability boundary. | Implementing campaign logic, provider credentials, backend token registration, or business routing. | `@precision-calm/notifications` |

### Check For an App Update

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoUpdates, usePrecisionUpdates | A product has an approved Expo Updates deployment policy and wants a user-controlled update flow. | Configuring update channels, runtime versions, credentials, or automatic production OTA behavior. | `@precision-calm/updates` |

### Read Application Device Information

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoDevice, usePrecisionDevice | Showing product support/version information or adapting a documented capability boundary. | Fingerprinting users or adding arbitrary device-specific feature branches. | `@precision-calm/device` |

### Add Haptic Feedback

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ExpoHaptics, usePrecisionHaptics | A non-essential interaction should offer tactile confirmation on supported hardware. | A workflow outcome depends on vibration or a route would import expo-haptics directly. | `@precision-calm/haptics` |

### Report an Error or Event

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| NoopObservability, RecordingObservability, usePrecisionObservability | A product has selected a root vendor integration or needs deterministic no-op/recording behavior in tests. | Adding a vendor SDK to a feature, silently swallowing errors, or transmitting secrets/PII. | `@precision-calm/observability` |

### Show a Chart

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ChartFrame, LineChart, BarChart, DonutChart, Sparkline | A product needs line, area, bar, donut, sparkline, or progress presentation. | It needs stacked/composite analytics, dense marks, sophisticated axes/tooltips, or a full chart engine. | `@precision-calm/ui` |
| ChartFrame, LineChart, BarChart, DonutChart, ChartLegend, ChartDataTable | A product needs a small line, area, bar, donut, trend, or progress visualization with shared state/accessibility anatomy. | A product needs stacked/composite analytics, thousands of marks, an enterprise chart engine, or domain-specific visual storytelling. | `@precision-calm/ui` |

### Show Progress

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ProgressBar, ProgressRing | Showing known completion or quota progress. | Showing indeterminate activity; use LoadingState. | `@precision-calm/ui` |

### Build a Workflow

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| FormWorkspaceLayout, ReviewWorkflowLayout, ImportWorkflowLayout, CompletionLayout, PermissionRationaleLayout, OfflineWorkspaceLayout | A Golden workflow taxonomy entry matches the product request. | The workflow is a unique product visualization or domain-specific interaction that has no repeated generic structure. | `@precision-calm/ui` |
| ServerStateContent | Rendering a query-backed Golden pattern while product code supplies domain copy and content slots. | Rendering a purely local action or inventing a route-local query-state switch. | `@precision-calm/ui` |

### Open a Command Launcher

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| CommandLauncher | A navigation shell or workflow needs a bounded local command set. | Creating a global command bus, a backend search system, or a product-local overlay implementation. | `@precision-calm/ui` |

### Scaffold a Screen

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| scaffold-precision-screen | Adding a standard product screen whose Golden workflow has scaffold availability. | Overwriting an existing route, creating a trivial component, or forcing a unique product workflow into an unsuitable pattern. | `@precision-calm/create-app` |

### Reveal Supporting Content

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Disclosure, Accordion, SegmentedControl, StepIndicator | A product needs supplementary inline content, a small finite choice, or to communicate an existing workflow step. | Information is critical but hidden behind a tooltip, choices are numerous/searchable, or a route needs domain workflow validation. | `@precision-calm/ui` |

### Enter a Semantic Value

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| EmailField, UrlField, PhoneField, NumberField, CurrencyField, NumberStepper | Collecting a common email, URL, phone, numeric, currency, or bounded number value. | A product needs regional phone policy, accounting rules, date/time/range values, slider gestures, or domain-only parsing; use the date/time owner for portable calendar values. | `@precision-calm/ui` |

### Choose From a Searchable List

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| ComboboxField, MultiSelectField | Selecting from a bounded or product-filtered option list without rebuilding a Popover and menu in each route. | The result set is unbounded, needs a domain search screen, or product code is trying to put a query cache in the field. | `@precision-calm/ui` |

### Collect a Verification Code

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| CodeField | A product collects a short verification code or local PIN. | Implementing MFA/provider enrollment, backend authentication, or a long secret/password. | `@precision-calm/ui` |

### Manage Advanced Form Lifecycle

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| usePrecisionFieldArray, usePrecisionConditionalField, createPrecisionAsyncValidator, usePrecisionAutosave | A product using RHF needs repeatable typed rows, dependent field reset policy, async server validation, or a consciously chosen autosave cadence. | Trying to intercept unsupported router navigation universally, persist drafts without selecting storage, or create a no-policy form DSL. | `@precision-calm/form-rhf` |

### Paginate or Scale a Dataset

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| CursorPagination, InfinitePagination, useDataColumnVisibility, ListScreen, SectionListScreen | A query-backed workspace has page, cursor, or next-page lifecycle, or a moderate table needs user-controlled visible columns. | A product needs an enterprise grid with pinning/resizing or assumes a table can virtualize inside an arbitrary scroll surface. | `@precision-calm/ui` |

### Build a Filter Heavy Browse Screen

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| FilterDrawer, DataToolbar | A browse/data workspace has more filters than quiet inline chips can communicate. | A small static filter set fits DataToolbar chips or a domain-specific search route is clearer. | `@precision-calm/ui` |

### Preserve Accessibility

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| PrecisionWebAccessibilityStyles | Composing an Expo Router web document root; generated applications include it automatically. | Styling a feature or replacing semantic selected/error state with color alone. | `@precision-calm/ui` |

### Show Media

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| MediaFrame | Presenting a local or provider-resolved image/media preview in a product surface. | Acquiring camera/library media, uploading, editing media, or using an unreviewed raw Image in a route. | `@precision-calm/ui` |

### Show Identity or Status

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Avatar, AvatarGroup, StatusIndicator | Showing a person or small identity set, or a generic operational status with optional explanation. | Encoding product presence rules, domain status taxonomies, or social behavior. | `@precision-calm/ui` |

### Show Code or Configuration

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| CodeBlock | Showing identifiers, JSON, configuration, logs, or code without syntax-highlighting requirements. | Building an editor, terminal, or syntax-highlighting IDE surface. | `@precision-calm/ui` |

### Separate Content

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Divider | Sibling content needs a visible structural separator not already supplied by its shared row/card owner. | Spacing or a containing surface communicates grouping more clearly. | `@precision-calm/ui` |

### Copy a Value

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| CopyButton, CopyableValue, CopyableCode | A selected sharing profile needs copyable identifiers, addresses, URLs, code, or explicitly revealable values. | Copy is prohibited by product security policy or the value itself should never be rendered. | `@precision-calm/sharing` |

### Collect a Date or Time

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| DateField, TimeField, DateRangeField | A form can accept explicit YYYY-MM-DD or HH:mm values, or an optional native picker adapter supplies the same values. | The product needs scheduling rules, recurrence, timezone conversion, or a bespoke booking calendar. | `@precision-calm/ui` |

### Show Event History

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| Timeline | Showing audit history, workflow progress, account activity, order events, or system changes. | A general feed/list is more accurate or the domain needs a specialized process diagram. | `@precision-calm/ui` |

### Export or Copy Data

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| serializeDelimitedData | A product has already authorized an export and needs neutral tabular serialization. | Generating Excel/PDF, defining export permissions, or deciding file delivery and retention policy. | `@precision-calm/ui` |

### Show Composition or Compact Trend

| Owner | Use when | Do not use when | Package |
| --- | --- | --- | --- |
| AreaChart, StackedBarChart, Sparkline, ChartSeriesDataTable | A dashboard or report needs an ordinary trend, compact sparkline, or small non-negative stacked composition. | A product needs thousands of marks, specialized financial/geographic charts, arbitrary composites, or a general chart engine. | `@precision-calm/ui` |

## Current limits

- **usePrecisionForm, controlled field adapters, keyboard flow, error focus** — Focuses the first invalid supported field. Optional integration; drafts, autosave, arrays, and dependent fields remain later work. (stable-with-draft-limit).
- **FormErrorSummary, FormDiscardDialog, useFormLeaveGuard** — One alert summary links to registered invalid fields; inline field errors remain polite and contextual. Use FormScreen for keyboard ownership and the optional form-RHF lifecycle adapter for React Hook Form. (stable-with-draft-limit).
- **usePrecisionFormLifecycle, usePrecisionFormErrorSummary, applyPrecisionFormServerErrors** — Maps one post-submit summary to registered field focus while retaining contextual inline errors. Optional RHF integration; feature routes must not import react-hook-form directly. (stable-with-draft-limit).
- **AdaptiveDataTable, DataToolbar, SelectionBar, Pagination** — Selection and rows use shared press/checked semantics. No direct fetch or table-owned query client. (stable-with-scale-limit).
- **DetailLayout, KeyValueList, ListRow, Metric** — Key/value labels and values preserve structured relationships. Sharing/export is not a current kernel owner. (stable-with-known-gap).
- **precisionQueryKey, usePrecisionQuery** — The lifecycle union maps to shared loading/error/degraded announcements rather than route-local spinners. Transport-neutral and React Native/web safe; refocus/reconnect integration remains a Phase 4 root capability. (stable-with-offline-boundary).
- **usePrecisionServerState, query.refresh** — Retains usable content during refresh so actions and reading context do not disappear. Persistence and connectivity orchestration are intentionally not enabled. (stable-with-offline-boundary).
- **usePrecisionMutation** — Shared action controls expose busy/disabled semantics while product copy describes the result. Mutations do not retry or persist by default and do not fake offline queuing. (stable-with-offline-boundary).
- **toPrecisionAsyncState, AsyncStateView** — Shared feedback owns loading/error/degraded semantics while retained content remains readable and actionable. Offline presentation requires a real future connectivity owner; no offline state is inferred here. (stable-with-offline-boundary).
- **PrecisionRuntimeProvider, usePrecisionServices, AppServices adapters** — Pair service outcomes with feedback owners. Optional Expo capability adapters are not installed yet; do not invent a direct boundary. (stable-with-capability-gap).
- **PrecisionSessionSecurityBootstrap, usePrecisionSessionSecurity** — Use standard unlock form/feedback patterns. Only the memory adapter exists; device-backed adapters are later optional capabilities. (stable-boundary).
- **ExpoConnectivity, ReactNativeAppLifecycle, PrecisionServerStateRuntimeBridge** — Products own degraded/offline copy; shared feedback owns presentation. Refetch-on-reconnect and foreground are both false by default; no offline queue is implied. (stable-with-offline-boundary).
- **ExpoNotifications, usePrecisionNotifications** — Products own notification meaning; route visible outcomes through shared feedback. No automatic token registration; web push token support is intentionally unclaimed. (stable-with-product-backend-boundary).
- **ExpoUpdates, usePrecisionUpdates** — Use shared feedback and destructive/restart confirmation patterns where appropriate. Web is unsupported and disabled Expo Updates is configuration-missing; no automatic reload occurs. (stable-with-release-policy-boundary).
- **NoopObservability, RecordingObservability, usePrecisionObservability** — Observability never replaces user-facing shared feedback. No vendor dependency, telemetry, or collection is enabled by default. (stable-with-product-vendor-boundary).
- **ChartFrame, LineChart, BarChart, DonutChart, Sparkline** — Charts include summaries and can expose a visible keyboard-readable data table. Keep specialized/heavy chart engines optional. (stable-with-advanced-chart-limit).
- **Disclosure, Accordion, SegmentedControl, StepIndicator** — Disclosure owns expanded state; segmented choices use radio semantics; steps expose progressbar position. No decorative expansion animation is required, so reduced motion remains correct by default. (stable-with-tooltip-limit).
- **EmailField, UrlField, PhoneField, NumberField, CurrencyField, NumberStepper** — Uses visible labels, error relationships, keyboard intent, and adjustable stepper semantics. Locale formatting uses the runtime i18n provider; currency is never reformatted mid-entry. (stable-with-domain-policy-boundary).
- **ComboboxField, MultiSelectField** — Named combobox/menu semantics, expanded state, selected state, live status, Escape dismissal, and focus restoration are shared. Products connect async options through server-state or a service; the field never owns transport/cache identity. (stable-with-unbounded-search-limit).
- **usePrecisionFieldArray, usePrecisionConditionalField, createPrecisionAsyncValidator, usePrecisionAutosave** — Retains the shared error summary, field error, focus, and dirty-discard lifecycle. Autosave persistence/upload targets remain product services; durable local drafts require a selected capability. (stable-with-router-interception-limit).
- **CursorPagination, InfinitePagination, useDataColumnVisibility, ListScreen, SectionListScreen** — Pagination and filter actions are named controls; table selection remains shared. Server-state owns cursors, cached pages, stale data, and refetch—not the data UI. (stable-with-enterprise-grid-limit).
- **ChartFrame, LineChart, BarChart, DonutChart, ChartLegend, ChartDataTable** — Noninteractive charts announce a summary; optional ChartDataTable supplies a visible detailed fallback; interactive points are named controls. No decorative animation is required, so reduced-motion behavior is stable without a chart animation engine. (stable-with-advanced-chart-limit).
- **CopyButton, CopyableValue, CopyableCode** — Actions have changing names and polite result feedback; hidden sensitive values are announced as hidden. Use @precision-calm/sharing/ui after selecting the clipboard capability and @precision-calm/sharing/runtime during root registration; there is no direct browser clipboard fallback. (optional-capability).
- **DateField, TimeField, DateRangeField** — Every value has a visible label, format/locale help, and shared error relationship. Calendar dates and wall-clock values are timezone-free. Native picker UI is an optional documented adapter, not a kernel dependency. (stable-portable-input).
- **AreaChart, StackedBarChart, Sparkline, ChartSeriesDataTable** — Charts announce a summary and support a visible data table; stacked categories can expose named touch/keyboard targets. Dependency-free beyond the existing react-native-svg chart boundary; stacked values are finite and non-negative. (stable-with-specialized-chart-limit).

For planned capabilities, consult the [Golden Template audit](./GOLDEN_TEMPLATE_AUDIT.md);
planned items are not sanctioned APIs.
