import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizeExpoBaseServerError, type ExpoBaseServerError } from './errors';
import { normalizeExpoBaseQueryKey, type ExpoBaseQueryKey } from './keys';
import { getExpoBaseQueryImplementation, scopeQueryKey, type ExpoBaseQueryFunctionContext } from './client';
import { expoBaseRetryDelayMs, shouldRetryExpoBaseQuery, type ExpoBaseRetryPolicy } from './policy';
import { useExpoBaseServerState } from './ExpoBaseServerStateProvider';

export type ExpoBaseQueryState<TData> =
  | { kind: 'disabled'; data: TData | undefined }
  | { kind: 'initial-loading' }
  | { kind: 'error'; error: ExpoBaseServerError }
  | {
      kind: 'content';
      data: TData;
      freshness: 'fresh' | 'stale';
      refresh: { status: 'idle' } | { status: 'refreshing' } | { status: 'error'; error: ExpoBaseServerError };
    };

export interface ExpoBaseQueryOptions<TData> {
  key: ExpoBaseQueryKey;
  query: (context: ExpoBaseQueryFunctionContext) => Promise<TData>;
  enabled?: boolean | undefined;
  staleTimeMs?: number | undefined;
  retry?: ExpoBaseRetryPolicy | false | undefined;
}

export interface ExpoBaseQueryResult<TData> {
  state: ExpoBaseQueryState<TData>;
  refresh(): Promise<{ ok: true } | { ok: false; error: ExpoBaseServerError }>;
}

export interface ExpoBaseQuerySnapshot<TData> {
  enabled: boolean;
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  data: TData | undefined;
  error: unknown;
  isStale: boolean;
}

export function resolveExpoBaseQueryState<TData>(snapshot: ExpoBaseQuerySnapshot<TData>): ExpoBaseQueryState<TData> {
  if (!snapshot.enabled) return { kind: 'disabled', data: snapshot.data };
  if (snapshot.data === undefined) {
    if (snapshot.status === 'error') return { kind: 'error', error: normalizeExpoBaseServerError(snapshot.error) };
    return { kind: 'initial-loading' };
  }
  const refresh = snapshot.fetchStatus === 'fetching'
    ? { status: 'refreshing' as const }
    : snapshot.status === 'error'
      ? { status: 'error' as const, error: normalizeExpoBaseServerError(snapshot.error) }
      : { status: 'idle' as const };
  return { kind: 'content', data: snapshot.data, freshness: snapshot.isStale ? 'stale' : 'fresh', refresh };
}

export function useExpoBaseQuery<TData>(options: ExpoBaseQueryOptions<TData>): ExpoBaseQueryResult<TData> {
  const client = useExpoBaseServerState();
  const key = useMemo(() => normalizeExpoBaseQueryKey(options.key), [options.key]);
  const enabled = options.enabled ?? true;
  const result = useQuery<TData, ExpoBaseServerError>({
    queryKey: scopeQueryKey(client, key),
    queryFn: async ({ signal }) => {
      try { return await options.query({ signal, key }); }
      catch (error) { throw normalizeExpoBaseServerError(error); }
    },
    enabled,
    ...(options.staleTimeMs === undefined ? {} : { staleTime: Math.max(0, Math.trunc(options.staleTimeMs)) }),
    ...(options.retry === undefined ? {} : {
      retry: (failureCount, error) => shouldRetryExpoBaseQuery(failureCount, error, options.retry),
      retryDelay: (failureCount, error) => expoBaseRetryDelayMs(failureCount, error, options.retry),
    }),
  }, getExpoBaseQueryImplementation(client));

  const state = useMemo<ExpoBaseQueryState<TData>>(() => resolveExpoBaseQueryState({
    enabled,
    status: result.status,
    fetchStatus: result.fetchStatus,
    data: result.data,
    error: result.error,
    isStale: result.isStale,
  }), [enabled, result.data, result.error, result.fetchStatus, result.isStale, result.status]);

  const refresh = useCallback(async () => {
    const next = await result.refetch({ cancelRefetch: true });
    return next.error
      ? { ok: false as const, error: normalizeExpoBaseServerError(next.error) }
      : { ok: true as const };
  }, [result.refetch]);

  return useMemo(() => ({ state, refresh }), [state, refresh]);
}
