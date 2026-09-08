import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { normalizePrecisionServerError, type PrecisionServerError } from './errors';
import { normalizePrecisionQueryKey, type PrecisionQueryKey } from './keys';
import { getPrecisionQueryImplementation, scopeQueryKey, type PrecisionQueryFunctionContext } from './client';
import { precisionRetryDelayMs, shouldRetryPrecisionQuery, type PrecisionRetryPolicy } from './policy';
import { usePrecisionServerState } from './PrecisionServerStateProvider';

export type PrecisionQueryState<TData> =
  | { kind: 'disabled'; data: TData | undefined }
  | { kind: 'initial-loading' }
  | { kind: 'error'; error: PrecisionServerError }
  | {
      kind: 'content';
      data: TData;
      freshness: 'fresh' | 'stale';
      refresh: { status: 'idle' } | { status: 'refreshing' } | { status: 'error'; error: PrecisionServerError };
    };

export interface PrecisionQueryOptions<TData> {
  key: PrecisionQueryKey;
  query: (context: PrecisionQueryFunctionContext) => Promise<TData>;
  enabled?: boolean | undefined;
  staleTimeMs?: number | undefined;
  retry?: PrecisionRetryPolicy | false | undefined;
}

export interface PrecisionQueryResult<TData> {
  state: PrecisionQueryState<TData>;
  refresh(): Promise<{ ok: true } | { ok: false; error: PrecisionServerError }>;
}

export interface PrecisionQuerySnapshot<TData> {
  enabled: boolean;
  status: 'pending' | 'success' | 'error';
  fetchStatus: 'fetching' | 'paused' | 'idle';
  data: TData | undefined;
  error: unknown;
  isStale: boolean;
}

export function resolvePrecisionQueryState<TData>(snapshot: PrecisionQuerySnapshot<TData>): PrecisionQueryState<TData> {
  if (!snapshot.enabled) return { kind: 'disabled', data: snapshot.data };
  if (snapshot.data === undefined) {
    if (snapshot.status === 'error') return { kind: 'error', error: normalizePrecisionServerError(snapshot.error) };
    return { kind: 'initial-loading' };
  }
  const refresh = snapshot.fetchStatus === 'fetching'
    ? { status: 'refreshing' as const }
    : snapshot.status === 'error'
      ? { status: 'error' as const, error: normalizePrecisionServerError(snapshot.error) }
      : { status: 'idle' as const };
  return { kind: 'content', data: snapshot.data, freshness: snapshot.isStale ? 'stale' : 'fresh', refresh };
}

export function usePrecisionQuery<TData>(options: PrecisionQueryOptions<TData>): PrecisionQueryResult<TData> {
  const client = usePrecisionServerState();
  const key = useMemo(() => normalizePrecisionQueryKey(options.key), [options.key]);
  const enabled = options.enabled ?? true;
  const result = useQuery<TData, PrecisionServerError>({
    queryKey: scopeQueryKey(client, key),
    queryFn: async ({ signal }) => {
      try { return await options.query({ signal, key }); }
      catch (error) { throw normalizePrecisionServerError(error); }
    },
    enabled,
    ...(options.staleTimeMs === undefined ? {} : { staleTime: Math.max(0, Math.trunc(options.staleTimeMs)) }),
    ...(options.retry === undefined ? {} : {
      retry: (failureCount, error) => shouldRetryPrecisionQuery(failureCount, error, options.retry),
      retryDelay: (failureCount, error) => precisionRetryDelayMs(failureCount, error, options.retry),
    }),
  }, getPrecisionQueryImplementation(client));

  const state = useMemo<PrecisionQueryState<TData>>(() => resolvePrecisionQueryState({
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
      ? { ok: false as const, error: normalizePrecisionServerError(next.error) }
      : { ok: true as const };
  }, [result.refetch]);

  return useMemo(() => ({ state, refresh }), [state, refresh]);
}
