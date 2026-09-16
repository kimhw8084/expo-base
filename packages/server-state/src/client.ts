import { QueryClient, type QueryKey } from '@tanstack/react-query';
import { normalizeExpoBaseServerError } from './errors';
import { normalizeExpoBaseQueryKey, type ExpoBaseQueryKey } from './keys';
import {
  expoBaseRetryDelayMs,
  expoBaseServerStateDefaults,
  shouldRetryExpoBaseQuery,
  type ExpoBaseRetryPolicy,
  type ExpoBaseServerStateConfig,
} from './policy';

export type ExpoBaseServerStateScope =
  | { readonly kind: 'public'; readonly id?: string | undefined; readonly revision?: string | number | undefined }
  | { readonly kind: 'session'; readonly id: string; readonly revision: string | number };

export interface ExpoBaseQueryFunctionContext {
  signal: AbortSignal;
  key: ExpoBaseQueryKey;
}

export interface ExpoBaseFetchQueryOptions<TData> {
  key: ExpoBaseQueryKey;
  query: (context: ExpoBaseQueryFunctionContext) => Promise<TData>;
  staleTimeMs?: number | undefined;
  retry?: ExpoBaseRetryPolicy | false | undefined;
}

export interface ExpoBaseInvalidateOptions {
  exact?: boolean | undefined;
  refetch?: 'active' | 'all' | 'none' | undefined;
}

const implementations = new WeakMap<ExpoBaseServerStateClient, QueryClient>();

interface ResolvedExpoBaseServerStateConfig {
  staleTimeMs: number;
  cacheRetentionMs: number;
  queryRetry: ExpoBaseRetryPolicy | false;
}

export class ExpoBaseServerStateClient {
  #scope: ExpoBaseServerStateScope;
  readonly config: Readonly<ResolvedExpoBaseServerStateConfig>;

  constructor(scope: ExpoBaseServerStateScope = { kind: 'public' }, config: ExpoBaseServerStateConfig = {}) {
    this.#scope = normalizeScope(scope);
    this.config = Object.freeze({
      staleTimeMs: normalizeDuration(config.staleTimeMs, expoBaseServerStateDefaults.staleTimeMs),
      cacheRetentionMs: normalizeDuration(config.cacheRetentionMs, expoBaseServerStateDefaults.cacheRetentionMs),
      queryRetry: config.queryRetry ?? { retries: expoBaseServerStateDefaults.queryRetries },
    });
    implementations.set(this, new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: this.config.staleTimeMs,
          gcTime: this.config.cacheRetentionMs,
          retry: (failureCount, error) => shouldRetryExpoBaseQuery(failureCount, error, this.config.queryRetry),
          retryDelay: (failureCount, error) => expoBaseRetryDelayMs(failureCount, error, this.config.queryRetry),
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          networkMode: 'always',
        },
        mutations: { retry: false, networkMode: 'always' },
      },
    }));
  }

  get scope(): ExpoBaseServerStateScope { return this.#scope; }

  async fetch<TData>(options: ExpoBaseFetchQueryOptions<TData>): Promise<TData> {
    const key = normalizeExpoBaseQueryKey(options.key);
    return getExpoBaseQueryImplementation(this).fetchQuery({
      queryKey: scopeQueryKey(this, key),
      queryFn: async ({ signal }) => {
        try { return await options.query({ signal, key }); }
        catch (error) { throw normalizeExpoBaseServerError(error); }
      },
      ...(options.staleTimeMs === undefined ? {} : { staleTime: normalizeDuration(options.staleTimeMs, this.config.staleTimeMs) }),
      ...(options.retry === undefined ? {} : {
        retry: (failureCount: number, error: unknown) => shouldRetryExpoBaseQuery(failureCount, error, options.retry),
        retryDelay: (failureCount: number, error: unknown) => expoBaseRetryDelayMs(failureCount, error, options.retry),
      }),
    });
  }

  getData<TData>(key: ExpoBaseQueryKey): TData | undefined {
    return getExpoBaseQueryImplementation(this).getQueryData<TData>(scopeQueryKey(this, normalizeExpoBaseQueryKey(key)));
  }

  setData<TData>(key: ExpoBaseQueryKey, value: TData | ((current: TData | undefined) => TData | undefined)): TData | undefined {
    return getExpoBaseQueryImplementation(this).setQueryData<TData>(scopeQueryKey(this, normalizeExpoBaseQueryKey(key)), value);
  }

  remove(key: ExpoBaseQueryKey): void {
    getExpoBaseQueryImplementation(this).removeQueries({ queryKey: scopeQueryKey(this, normalizeExpoBaseQueryKey(key)), exact: true });
  }

  async invalidate(key?: ExpoBaseQueryKey, options: ExpoBaseInvalidateOptions = {}): Promise<void> {
    await getExpoBaseQueryImplementation(this).invalidateQueries({
      queryKey: key ? scopeQueryKey(this, normalizeExpoBaseQueryKey(key)) : scopeRootKey(this),
      exact: options.exact ?? false,
      refetchType: options.refetch ?? 'active',
    });
  }

  async refetch(key: ExpoBaseQueryKey, options: { exact?: boolean | undefined; type?: 'active' | 'all' | undefined } = {}): Promise<void> {
    await getExpoBaseQueryImplementation(this).refetchQueries({
      queryKey: scopeQueryKey(this, normalizeExpoBaseQueryKey(key)),
      exact: options.exact ?? true,
      type: options.type ?? 'active',
    });
  }

  async cancel(key?: ExpoBaseQueryKey): Promise<void> {
    await getExpoBaseQueryImplementation(this).cancelQueries({
      queryKey: key ? scopeQueryKey(this, normalizeExpoBaseQueryKey(key)) : scopeRootKey(this),
    }, { silent: true, revert: true });
  }

  /** Clears all query and mutation state before adopting a new identity scope. */
  resetScope(scope: ExpoBaseServerStateScope): boolean {
    const next = normalizeScope(scope);
    if (expoBaseServerStateScopeId(next) === expoBaseServerStateScopeId(this.#scope)) return false;
    getExpoBaseQueryImplementation(this).clear();
    this.#scope = next;
    return true;
  }

  clear(): void { getExpoBaseQueryImplementation(this).clear(); }
  getQueryCount(): number { return getExpoBaseQueryImplementation(this).getQueryCache().getAll().length; }
  subscribe(listener: () => void): () => void { return getExpoBaseQueryImplementation(this).getQueryCache().subscribe(listener); }
}

export function createExpoBaseServerStateClient(scope?: ExpoBaseServerStateScope, config?: ExpoBaseServerStateConfig): ExpoBaseServerStateClient {
  return new ExpoBaseServerStateClient(scope, config);
}

export function expoBaseServerStateScopeId(scope: ExpoBaseServerStateScope): string {
  const normalized = normalizeScope(scope);
  return JSON.stringify([normalized.kind, normalized.id ?? 'default', normalized.revision ?? 0]);
}

export function getExpoBaseQueryImplementation(client: ExpoBaseServerStateClient): QueryClient {
  const implementation = implementations.get(client);
  if (!implementation) throw new Error('Unknown Expo Base server-state client.');
  return implementation;
}

export function scopeQueryKey(client: ExpoBaseServerStateClient, key: ExpoBaseQueryKey): QueryKey {
  return [...scopeRootKey(client), ...key];
}

function scopeRootKey(client: ExpoBaseServerStateClient): QueryKey {
  const scope = client.scope;
  return ['expo-base-server-state', scope.kind, scope.id ?? 'default', scope.revision ?? 0];
}

function normalizeScope(scope: ExpoBaseServerStateScope): ExpoBaseServerStateScope {
  if (scope.kind === 'session') {
    const id = scope.id.trim();
    if (!id) throw new Error('A session server-state scope requires a non-empty identity.');
    return { kind: 'session', id, revision: scope.revision };
  }
  const id = scope.id?.trim();
  return { kind: 'public', ...(id ? { id } : {}), ...(scope.revision === undefined ? {} : { revision: scope.revision }) };
}

function normalizeDuration(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.trunc(value));
}
