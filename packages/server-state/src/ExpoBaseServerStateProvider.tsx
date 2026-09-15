import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createExpoBaseServerStateClient,
  getExpoBaseQueryImplementation,
  expoBaseServerStateScopeId,
  type ExpoBaseServerStateClient,
  type ExpoBaseServerStateScope,
} from './client';
import type { ExpoBaseServerStateConfig } from './policy';

const ExpoBaseServerStateContext = createContext<ExpoBaseServerStateClient | null>(null);

export interface ExpoBaseServerStateProviderProps extends PropsWithChildren {
  scope?: ExpoBaseServerStateScope | undefined;
  config?: ExpoBaseServerStateConfig | undefined;
}

/**
 * Creates one cache per public/session scope. A scope transition mounts an
 * empty client immediately, then clears the retired client after commit.
 */
export function ExpoBaseServerStateProvider({ children, scope = { kind: 'public' }, config }: ExpoBaseServerStateProviderProps) {
  const scopeId = expoBaseServerStateScopeId(scope);
  const staleTimeMs = config?.staleTimeMs;
  const cacheRetentionMs = config?.cacheRetentionMs;
  const queryRetry = config?.queryRetry;
  const queryRetryDisabled = queryRetry === false;
  const queryRetries = queryRetry ? queryRetry.retries : undefined;
  const shouldRetry = queryRetry ? queryRetry.shouldRetry : undefined;
  const retryDelayMs = queryRetry ? queryRetry.delayMs : undefined;
  const client = useMemo(
    () => createExpoBaseServerStateClient(scope, {
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
    <ExpoBaseServerStateContext.Provider value={client}>
      <QueryClientProvider client={getExpoBaseQueryImplementation(client)}>{children}</QueryClientProvider>
    </ExpoBaseServerStateContext.Provider>
  );
}

export function useExpoBaseServerState(): ExpoBaseServerStateClient {
  const client = useContext(ExpoBaseServerStateContext);
  if (!client) throw new Error('useExpoBaseServerState requires ExpoBaseServerStateProvider or ExpoBaseRuntimeProvider.');
  return client;
}
