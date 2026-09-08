import type { PropsWithChildren } from 'react';
import type { AppServices } from '@precision-calm/adapters';
import type { ReturnIntentChannel, ReturnIntentPolicy } from '@precision-calm/auth';
import { PrecisionCapabilitiesProvider, type PrecisionCapabilityRegistry } from '@precision-calm/capabilities';
import type { PrecisionLinkingRuntime } from '@precision-calm/linking';
import type { SessionSecurityAdapter } from '@precision-calm/session-security';
import { PrecisionI18nProvider, type PrecisionI18nOptions } from '@precision-calm/i18n';
import { KeyboardRootProvider } from '@precision-calm/layouts';
import { MotionRootProvider } from '@precision-calm/motion';
import { OverlayRootProvider } from '@precision-calm/overlays';
import { DensityProvider, type PrecisionDensity } from '@precision-calm/primitives';
import { PrecisionServerStateProvider, type PrecisionServerStateConfig, type PrecisionServerStateScope } from '@precision-calm/server-state';
import { PrecisionAuthProvider, usePrecisionAuth } from './auth';
import { PrecisionAuthorizationProvider } from './authorization';
import { PrecisionLinkingProvider } from './linking';
import { PrecisionServicesProvider } from './services';
import { PrecisionSessionSecurityProvider } from './sessionSecurity';

export interface PrecisionRuntimeProviderProps extends PropsWithChildren {
  /** Application-wide information density. Touch-target geometry remains safe. */
  density?: PrecisionDensity;
  /** Optional backend/service composition. Supplying this enables usePrecisionServices(). */
  services?: AppServices;
  /** Auth resolution is enabled by default when services are supplied. */
  auth?: { enabled?: boolean; returnIntentPolicy?: ReturnIntentPolicy; returnIntentChannel?: ReturnIntentChannel };
  /** Capability/entitlement resolution; requires auth and is enabled by default with services. */
  authorization?: { enabled?: boolean };
  /** Optional centralized external/deep-link policy. Supplying this enables usePrecisionLinking(). */
  linking?: PrecisionLinkingRuntime;
  /** Optional local session-security boundary. When configured, auth access fails closed until it resolves unlocked. */
  sessionSecurity?: { adapter: SessionSecurityAdapter };
  /** Locale, message, direction, and formatting policy. Product message catalogs remain application-owned. */
  i18n?: PrecisionI18nOptions;
  /** Optional application-level reduced-motion override for previews and supported accessibility settings. */
  motion?: { reducedMotion?: boolean };
  /** Explicitly selected optional native/browser capability adapters. The kernel installs none by default. */
  capabilities?: PrecisionCapabilityRegistry | undefined;
  /** Query cache defaults. Persistence, connectivity, and native lifecycle integration remain opt-in boundaries. */
  serverState?: PrecisionServerStateConfig;
}

/**
 * Owns replaceable application-wide runtime integrations. Product features
 * should not import keyboard, motion, overlay, linking, auth, or backend implementations.
 */
export function PrecisionRuntimeProvider({ children, density = 'comfortable', services, auth, authorization, linking, sessionSecurity, i18n, motion, capabilities, serverState }: PrecisionRuntimeProviderProps) {
  let content = <DensityProvider density={density}>{children}</DensityProvider>;
  if (services) {
    if (auth?.enabled !== false) {
      if (authorization?.enabled !== false) content = <PrecisionAuthorizationProvider adapter={services.authorization}>{content}</PrecisionAuthorizationProvider>;
      content = <AuthenticatedServerState config={serverState}>{content}</AuthenticatedServerState>;
      content = <PrecisionAuthProvider adapter={services.auth} {...(auth?.returnIntentPolicy ? { returnIntentPolicy: auth.returnIntentPolicy } : {})} {...(auth?.returnIntentChannel ? { returnIntentChannel: auth.returnIntentChannel } : {})}>{content}</PrecisionAuthProvider>;
    } else content = <PrecisionServerStateProvider config={serverState}>{content}</PrecisionServerStateProvider>;
    content = <PrecisionServicesProvider services={services}>{content}</PrecisionServicesProvider>;
  } else content = <PrecisionServerStateProvider config={serverState}>{content}</PrecisionServerStateProvider>;
  if (linking) content = <PrecisionLinkingProvider linking={linking}>{content}</PrecisionLinkingProvider>;
  if (sessionSecurity) content = <PrecisionSessionSecurityProvider adapter={sessionSecurity.adapter}>{content}</PrecisionSessionSecurityProvider>;
  return (
    <MotionRootProvider {...(motion?.reducedMotion === undefined ? {} : { reducedMotion: motion.reducedMotion })}>
      <PrecisionI18nProvider {...(i18n ?? {})}>
        <KeyboardRootProvider>
          <OverlayRootProvider><PrecisionCapabilitiesProvider capabilities={capabilities}>{content}</PrecisionCapabilitiesProvider></OverlayRootProvider>
        </KeyboardRootProvider>
      </PrecisionI18nProvider>
    </MotionRootProvider>
  );
}

function AuthenticatedServerState({ children, config }: PropsWithChildren<{ config?: PrecisionServerStateConfig | undefined }>) {
  const auth = usePrecisionAuth();
  const scope: PrecisionServerStateScope = auth.status === 'signed-in' && auth.session
    ? { kind: 'session', id: auth.session.user.id, revision: auth.sessionRevision }
    : { kind: 'public', id: `auth:${auth.status}`, revision: auth.sessionRevision };
  return <PrecisionServerStateProvider scope={scope} config={config}>{children}</PrecisionServerStateProvider>;
}
