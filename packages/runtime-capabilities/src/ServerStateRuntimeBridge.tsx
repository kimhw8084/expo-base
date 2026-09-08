import { useEffect, type PropsWithChildren } from 'react';
import { usePrecisionServerState } from '@precision-calm/server-state';
import type { PrecisionAppLifecycle, PrecisionConnectivity, PrecisionServerStateRuntimePolicy } from './contracts';

export interface PrecisionServerStateInvalidator {
  invalidate(key?: undefined, options?: { refetch?: 'active' | 'all' | 'none' | undefined }): Promise<void>;
}

/** Headless subscription bridge for deterministic tests and non-React root composition. */
export function connectPrecisionServerStateRuntime(
  client: PrecisionServerStateInvalidator,
  options: { connectivity?: PrecisionConnectivity | undefined; lifecycle?: PrecisionAppLifecycle | undefined; policy?: PrecisionServerStateRuntimePolicy | undefined },
): () => void {
  const policy = options.policy ?? {};
  let previousConnectivity: 'online' | 'offline' | 'unknown' | null = null;
  let previousLifecycle: string | null = null;
  const cleanups: Array<() => void> = [];
  if (options.connectivity && policy.refetchOnReconnect) {
    cleanups.push(options.connectivity.subscribe((state) => {
      const previous = previousConnectivity;
      previousConnectivity = state.status;
      if (previous === 'offline' && state.status === 'online') void client.invalidate(undefined, { refetch: 'active' });
    }));
  }
  if (options.lifecycle && policy.refetchOnForeground) {
    cleanups.push(options.lifecycle.subscribe((state) => {
      const previous = previousLifecycle;
      previousLifecycle = state;
      if ((previous === 'background' || previous === 'inactive') && state === 'active') void client.invalidate(undefined, { refetch: 'active' });
    }));
  }
  return () => { for (const cleanup of cleanups) cleanup(); };
}

/**
 * Optional, policy-controlled connection between device signals and server
 * state. It never infers offline persistence or enables refetching by default.
 */
export function PrecisionServerStateRuntimeBridge({
  children,
  connectivity,
  lifecycle,
  policy = {},
}: PropsWithChildren<{
  connectivity?: PrecisionConnectivity | undefined;
  lifecycle?: PrecisionAppLifecycle | undefined;
  policy?: PrecisionServerStateRuntimePolicy | undefined;
}>) {
  const client = usePrecisionServerState();
  useEffect(() => {
    return connectPrecisionServerStateRuntime(client, { connectivity, lifecycle, policy });
  }, [client, connectivity, lifecycle, policy]);
  return <>{children}</>;
}
