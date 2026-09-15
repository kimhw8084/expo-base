# Optional runtime capabilities

The Golden Kernel contains contracts and root registration only. Expo/native implementations are
small, opt-in workspace packages; a minimal generated app installs none of them. Product routes
consume a selected Expo Base adapter and never import an Expo capability module directly.

## Partition

| Concern | Classification | Owner | Web behavior | Native behavior |
| --- | --- | --- | --- | --- |
| Capability registration and normalized outcomes | Kernel contract | `@expo-base/capabilities` | Supported | Supported |
| Secret persistence | Optional capability | `@expo-base/secure-storage` | Explicitly unavailable; never falls back to browser storage | Expo SecureStore |
| Ordinary device preferences | Optional capability | `@expo-base/preferences` | Browser local storage when available | AsyncStorage |
| Connectivity and app lifecycle | Optional capability | `@expo-base/runtime-capabilities` | Expo network/browser-compatible signal | Expo Network and React Native AppState |
| Copy/share | Optional capability | `@expo-base/sharing` | Browser capability where Expo supports it | Expo Clipboard/Sharing |
| Document, image, and camera acquisition | Optional capability | `@expo-base/media` | Browser picker/permission behavior | Expo Document Picker, Image Picker, Camera permissions |
| Local device authentication | Optional capability | `@expo-base/local-auth` | Explicitly unavailable | Expo Local Authentication |
| Notifications | Optional capability | `@expo-base/notifications` | Explicitly unavailable for the push-token owner | Expo Notifications permission, token, response event |
| Updates | Optional capability | `@expo-base/updates` | Explicitly unavailable | Expo Updates when enabled/configured |
| Privacy-safe app/device facts | Optional capability | `@expo-base/device` | Supported with web-safe fields | Expo Application/Device |
| Haptic feedback | Optional capability | `@expo-base/haptics` | Explicitly unavailable | Expo Haptics |
| Logging/error/analytics timing boundary | Optional capability | `@expo-base/observability` | No-op or product integration | No-op or product integration |
| Feature flags, remote config, store/review links, location, background tasks | Recipe or product-specific | Product integration / linking policy | Varies | Varies |

`@expo-base/observability` is the final neutral boundary for logging, explicit error reports,
analytics events, and performance timing. Its no-op and recording implementations keep telemetry
off by default and tests deterministic. Vendor transports, consent, redaction policy, remote
configuration, experiments, and store/review prompting remain product infrastructure rather than
another Expo Base singleton.

`@expo-base/sharing/runtime` is the bootstrap-safe capability entry point;
`@expo-base/sharing/ui` exports capability-backed `CopyButton`, `CopyableValue`, and
`CopyableCode`. The UI owners expose copy progress/result semantics and explicit sensitive reveal
policy; they never bypass the selected adapter with direct browser clipboard access. The package
root preserves the combined public surface for non-bootstrap consumers.

Notifications are a device boundary only. Push providers, campaign logic, credentials, backend
registration, and product routing are product-owned. Updates expose manual check/download/reload;
channel, runtime version, and release policy remain application/release-owned. There is no default
telemetry, device fingerprint, push-token registration, persisted query cache, or native fallback
for secrets.

## Root composition

Select capability packages in the generator or add them deliberately, then compose them once:

```tsx
import { createExpoBaseCapabilityRegistry } from '@expo-base/capabilities';
import { ExpoSecureStorage } from '@expo-base/secure-storage';
import { ExpoConnectivity, ReactNativeAppLifecycle } from '@expo-base/runtime-capabilities';

const capabilities = createExpoBaseCapabilityRegistry({
  secureStorage: new ExpoSecureStorage({ namespace: 'com.example.app' }),
  connectivity: new ExpoConnectivity(),
  appLifecycle: new ReactNativeAppLifecycle(),
});

<ExpoBaseRuntimeProvider capabilities={capabilities}>{children}</ExpoBaseRuntimeProvider>;
```

Use the corresponding hook in a product route only after its root has selected and registered that
package. `useOptionalExpoBase…` allows a genuinely optional product behavior. The non-optional
hook throws an actionable composition error rather than silently degrading a security-sensitive
workflow.

## Availability and permissions

Every adapter reports `available` or a specific unavailable reason (`unsupported`,
`configuration-missing`, or `temporarily-unavailable`). Operations return a structured success,
unavailable, denied, restricted, cancelled, or normalized-error result. Permission adapters expose
current state, request, and settings handoff; products choose rationale copy and never assume iOS,
Android, and web have identical permission semantics.

`@expo-base/media` and `@expo-base/notifications` share the permission contract. A
denial is a user outcome, not an exception to report as an application crash.

## Security and privacy

- Only use `secure-storage` for secrets. It has no web/local-storage fallback.
- Use `preferences` for non-secret device-local choices such as theme, density, and locale. Server
  settings and product domain settings remain product-owned.
- Local-auth success is local device assurance; it is never backend authentication.
- Device info intentionally excludes stable identifiers and device names.
- Observability is provider-neutral and no-op until the product selects an integration. Never send
  secrets, tokens, or direct identifiers in attributes.
- Server-state persistence remains disabled. Connectivity/lifecycle can explicitly invalidate
  active queries through `ExpoBaseServerStateRuntimeBridge`; both reconnect and foreground
  refetch policies default to `false`.

## Generator selection and configuration

`create-expo-base-app --capabilities` accepts a comma-separated capability profile. It adds only
the selected Expo Base and Expo dependencies, root registration, and required Expo plugins.
`notifications` requires the Expo Notifications plugin; an Expo project ID is required only when a
product explicitly requests a push token. `updates` requires an enabled Expo Updates deployment
configuration before it can check/download/reload.

Doctor validates a generated app's selected capability manifest against dependencies, root
registration, and required plugins. It deliberately does not require production credentials.

## Testing

Every package provides a deterministic memory implementation. The reference capability lab uses
these fakes for unavailable/denied/cancelled behavior and labels them as such; it does not claim
hardware acceptance. Run `npm run test:runtime-capabilities` for capability contracts and
`npm run test:generator` for minimal and selected-profile parity.
