import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createPrecisionServerStateClient,
  getPrecisionQueryImplementation,
  precisionServerStateScopeId,
  type PrecisionServerStateClient,
  type PrecisionServerStateScope,
} from './client';
import type { PrecisionServerStateConfig } from './policy';

const PrecisionServerStateContext = createContext<PrecisionServerStateClient | null>(null);

export interface PrecisionServerStateProviderProps extends PropsWithChildren {
  scope?: PrecisionServerStateScope | undefined;
  config?: PrecisionServerStateConfig | undefined;
}

/**
 * Creates one cache per public/session scope. A scope transition mounts an
 * empty client immediately, then clears the retired client after commit.
 */
export function PrecisionServerStateProvider({ children, scope = { kind: 'public' }, config }: PrecisionServerStateProviderProps) {
  const scopeId = precisionServerStateScopeId(scope);
  const staleTimeMs = config?.staleTimeMs;
  const cacheRetentionMs = config?.cacheRetentionMs;
  const queryRetry = config?.queryRetry;
  const queryRetryDisabled = queryRetry === false;
  const queryRetries = queryRetry ? queryRetry.retries : undefined;
  const shouldRetry = queryRetry ? queryRetry.shouldRetry : undefined;
  const retryDelayMs = queryRetry ? queryRetry.delayMs : undefined;
  const client = useMemo(
    () => createPrecisionServerStateClient(scope, {
      ...(staleTimeMs === undefined ? {} : { staleTimeMs }),
      ...(cacheRetentionMs === undefined ? {} : { cacheRetentionMs }),
      ...(queryRetry === undefined ? {} : {
        queryRetry: queryRetry === false
          ? false
          : {
              retries: queryRetries ?? 0,
              ...(shouldRetry ? { shouldRetry } : {}),
              ...(retryDelayMs ? { delayMs: retryDelayMs } : {}),
            },
      }),
    }),
    [scopeId, staleTimeMs, cacheRetentionMs, queryRetryDisabled, queryRetries, shouldRetry, retryDelayMs],
  );
  useEffect(() => () => client.clear(), [client]);
  return (
    <PrecisionServerStateContext.Provider value={client}>
      <QueryClientProvider client={getPrecisionQueryImplementation(client)}>{children}</QueryClientProvider>
    </PrecisionServerStateContext.Provider>
  );
}

export function usePrecisionServerState(): PrecisionServerStateClient {
  const client = useContext(PrecisionServerStateContext);
  if (!client) throw new Error('usePrecisionServerState requires PrecisionServerStateProvider or PrecisionRuntimeProvider.');
  return client;
}
