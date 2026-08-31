import type { PropsWithChildren } from 'react';
import type { AppServices } from '@precision-calm/adapters';
import type { ReturnIntentChannel, ReturnIntentPolicy } from '@precision-calm/auth';
import type { PrecisionLinkingRuntime } from '@precision-calm/linking';
import { KeyboardRootProvider } from '@precision-calm/layouts';
import { MotionRootProvider } from '@precision-calm/motion';
import { OverlayRootProvider } from '@precision-calm/overlays';
import { DensityProvider, type PrecisionDensity } from '@precision-calm/primitives';
import { PrecisionAuthProvider } from './auth';
import { PrecisionAuthorizationProvider } from './authorization';
import { PrecisionLinkingProvider } from './linking';
import { PrecisionServicesProvider } from './services';

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
}

/**
 * Owns replaceable application-wide runtime integrations. Product features
 * should not import keyboard, motion, overlay, linking, auth, or backend implementations.
 */
export function PrecisionRuntimeProvider({ children, density = 'comfortable', services, auth, authorization, linking }: PrecisionRuntimeProviderProps) {
  let content = <DensityProvider density={density}>{children}</DensityProvider>;
  if (services) {
    if (auth?.enabled !== false) {
      if (authorization?.enabled !== false) content = <PrecisionAuthorizationProvider adapter={services.authorization}>{content}</PrecisionAuthorizationProvider>;
      content = <PrecisionAuthProvider adapter={services.auth} {...(auth?.returnIntentPolicy ? { returnIntentPolicy: auth.returnIntentPolicy } : {})} {...(auth?.returnIntentChannel ? { returnIntentChannel: auth.returnIntentChannel } : {})}>{content}</PrecisionAuthProvider>;
    }
    content = <PrecisionServicesProvider services={services}>{content}</PrecisionServicesProvider>;
  }
  if (linking) content = <PrecisionLinkingProvider linking={linking}>{content}</PrecisionLinkingProvider>;
  return (
    <MotionRootProvider>
      <KeyboardRootProvider>
        <OverlayRootProvider>{content}</OverlayRootProvider>
      </KeyboardRootProvider>
    </MotionRootProvider>
  );
}
