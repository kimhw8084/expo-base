import type { PropsWithChildren } from 'react';
import type { AppServices } from '@expo-base/adapters';
import type { ReturnIntentChannel, ReturnIntentPolicy } from '@expo-base/auth';
import { ExpoBaseCapabilitiesProvider, type ExpoBaseCapabilityRegistry } from '@expo-base/capabilities';
import type { ExpoBaseLinkingRuntime } from '@expo-base/linking';
import type { SessionSecurityAdapter } from '@expo-base/session-security';
import { ExpoBaseI18nProvider, type ExpoBaseI18nOptions } from '@expo-base/i18n';
import { KeyboardRootProvider } from '@expo-base/layouts';
import { MotionRootProvider } from '@expo-base/motion';
import { OverlayRootProvider } from '@expo-base/overlays';
import { DensityProvider, type ExpoBaseDensity } from '@expo-base/primitives';
import { ExpoBaseServerStateProvider, type ExpoBaseServerStateConfig, type ExpoBaseServerStateScope } from '@expo-base/server-state';
import { ExpoBaseAuthProvider, useExpoBaseAuth } from './auth';
import { ExpoBaseAuthorizationProvider } from './authorization';
import { ExpoBaseLinkingProvider } from './linking';
import { ExpoBaseServicesProvider } from './services';
import { ExpoBaseSessionSecurityProvider } from './sessionSecurity';

export interface ExpoBaseRuntimeProviderProps extends PropsWithChildren {
  /** Application-wide information density. Touch-target geometry remains safe. */
  density?: ExpoBaseDensity;
  /** Optional backend/service composition. Supplying this enables useExpoBaseServices(). */
  services?: AppServices;
  /** Auth resolution is enabled by default when services are supplied. */
  auth?: { enabled?: boolean; returnIntentPolicy?: ReturnIntentPolicy; returnIntentChannel?: ReturnIntentChannel };
  /** Capability/entitlement resolution; requires auth and is enabled by default with services. */
  authorization?: { enabled?: boolean };
  /** Optional centralized external/deep-link policy. Supplying this enables useExpoBaseLinking(). */
  linking?: ExpoBaseLinkingRuntime;
  /** Optional local session-security boundary. When configured, auth access fails closed until it resolves unlocked. */
  sessionSecurity?: { adapter: SessionSecurityAdapter };
  /** Locale, message, direction, and formatting policy. Product message catalogs remain application-owned. */
  i18n?: ExpoBaseI18nOptions;
  /** Optional application-level reduced-motion override for previews and supported accessibility settings. */
  motion?: { reducedMotion?: boolean };
  /** Explicitly selected optional native/browser capability adapters. The kernel installs none by default. */
  capabilities?: ExpoBaseCapabilityRegistry | undefined;
  /** Query cache defaults. Persistence, connectivity, and native lifecycle integration remain opt-in boundaries. */
  serverState?: ExpoBaseServerStateConfig;
}

/**
 * Owns replaceable application-wide runtime integrations. Product features
 * should not import keyboard, motion, overlay, linking, auth, or backend implementations.
 */
export function ExpoBaseRuntimeProvider({ children, density = 'comfortable', services, auth, authorization, linking, sessionSecurity, i18n, motion, capabilities, serverState }: ExpoBaseRuntimeProviderProps) {
  let content = <DensityProvider density={density}>{children}</DensityProvider>;
  if (services) {
    if (auth?.enabled !== false) {
      if (authorization?.enabled !== false) content = <ExpoBaseAuthorizationProvider adapter={services.authorization}>{content}</ExpoBaseAuthorizationProvider>;
      content = <AuthenticatedServerState config={serverState}>{content}</AuthenticatedServerState>;
      content = <ExpoBaseAuthProvider adapter={services.auth} {...(auth?.returnIntentPolicy ? { returnIntentPolicy: auth.returnIntentPolicy } : {})} {...(auth?.returnIntentChannel ? { returnIntentChannel: auth.returnIntentChannel } : {})}>{content}</ExpoBaseAuthProvider>;
    } else content = <ExpoBaseServerStateProvider config={serverState}>{content}</ExpoBaseServerStateProvider>;
    content = <ExpoBaseServicesProvider services={services}>{content}</ExpoBaseServicesProvider>;
  } else content = <ExpoBaseServerStateProvider config={serverState}>{content}</ExpoBaseServerStateProvider>;
  if (linking) content = <ExpoBaseLinkingProvider linking={linking}>{content}</ExpoBaseLinkingProvider>;
  if (sessionSecurity) content = <ExpoBaseSessionSecurityProvider adapter={sessionSecurity.adapter}>{content}</ExpoBaseSessionSecurityProvider>;
  return (
    <MotionRootProvider {...(motion?.reducedMotion === undefined ? {} : { reducedMotion: motion.reducedMotion })}>
      <ExpoBaseI18nProvider {...(i18n ?? {})}>
        <KeyboardRootProvider>
          <OverlayRootProvider><ExpoBaseCapabilitiesProvider capabilities={capabilities}>{content}</ExpoBaseCapabilitiesProvider></OverlayRootProvider>
        </KeyboardRootProvider>
      </ExpoBaseI18nProvider>
    </MotionRootProvider>
  );
}

function AuthenticatedServerState({ children, config }: PropsWithChildren<{ config?: ExpoBaseServerStateConfig | undefined }>) {
  const auth = useExpoBaseAuth();
  const scope: ExpoBaseServerStateScope = auth.status === 'signed-in' && auth.session
    ? { kind: 'session', id: auth.session.user.id, revision: auth.sessionRevision }
    : { kind: 'public', id: `auth:${auth.status}`, revision: auth.sessionRevision };
  return <ExpoBaseServerStateProvider scope={scope} config={config}>{children}</ExpoBaseServerStateProvider>;
}
