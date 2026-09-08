import { QueryClient, type QueryKey } from '@tanstack/react-query';
import { normalizePrecisionServerError } from './errors';
import { normalizePrecisionQueryKey, type PrecisionQueryKey } from './keys';
import {
  precisionRetryDelayMs,
  precisionServerStateDefaults,
  shouldRetryPrecisionQuery,
  type PrecisionRetryPolicy,
  type PrecisionServerStateConfig,
} from './policy';

export type PrecisionServerStateScope =
  | { readonly kind: 'public'; readonly id?: string | undefined; readonly revision?: string | number | undefined }
  | { readonly kind: 'session'; readonly id: string; readonly revision: string | number };

export interface PrecisionQueryFunctionContext {
  signal: AbortSignal;
  key: PrecisionQueryKey;
}

export interface PrecisionFetchQueryOptions<TData> {
  key: PrecisionQueryKey;
  query: (context: PrecisionQueryFunctionContext) => Promise<TData>;
  staleTimeMs?: number | undefined;
  retry?: PrecisionRetryPolicy | false | undefined;
}

export interface PrecisionInvalidateOptions {
  exact?: boolean | undefined;
  refetch?: 'active' | 'all' | 'none' | undefined;
}

const implementations = new WeakMap<PrecisionServerStateClient, QueryClient>();

interface ResolvedPrecisionServerStateConfig {
  staleTimeMs: number;
  cacheRetentionMs: number;
  queryRetry: PrecisionRetryPolicy | false;
}

export class PrecisionServerStateClient {
  #scope: PrecisionServerStateScope;
  readonly config: Readonly<ResolvedPrecisionServerStateConfig>;

  constructor(scope: PrecisionServerStateScope = { kind: 'public' }, config: PrecisionServerStateConfig = {}) {
    this.#scope = normalizeScope(scope);
    this.config = Object.freeze({
      staleTimeMs: normalizeDuration(config.staleTimeMs, precisionServerStateDefaults.staleTimeMs),
      cacheRetentionMs: normalizeDuration(config.cacheRetentionMs, precisionServerStateDefaults.cacheRetentionMs),
      queryRetry: config.queryRetry ?? { retries: precisionServerStateDefaults.queryRetries },
    });
    implementations.set(this, new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: this.config.staleTimeMs,
          gcTime: this.config.cacheRetentionMs,
          retry: (failureCount, error) => shouldRetryPrecisionQuery(failureCount, error, this.config.queryRetry),
          retryDelay: (failureCount, error) => precisionRetryDelayMs(failureCount, error, this.config.queryRetry),
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          networkMode: 'always',
        },
        mutations: { retry: false, networkMode: 'always' },
      },
    }));
  }

  get scope(): PrecisionServerStateScope { return this.#scope; }

  async fetch<TData>(options: PrecisionFetchQueryOptions<TData>): Promise<TData> {
    const key = normalizePrecisionQueryKey(options.key);
    return getPrecisionQueryImplementation(this).fetchQuery({
      queryKey: scopeQueryKey(this, key),
      queryFn: async ({ signal }) => {
        try { return await options.query({ signal, key }); }
        catch (error) { throw normalizePrecisionServerError(error); }
      },
      ...(options.staleTimeMs === undefined ? {} : { staleTime: normalizeDuration(options.staleTimeMs, this.config.staleTimeMs) }),
      ...(options.retry === undefined ? {} : {
        retry: (failureCount: number, error: unknown) => shouldRetryPrecisionQuery(failureCount, error, options.retry),
        retryDelay: (failureCount: number, error: unknown) => precisionRetryDelayMs(failureCount, error, options.retry),
      }),
    });
  }

  getData<TData>(key: PrecisionQueryKey): TData | undefined {
    return getPrecisionQueryImplementation(this).getQueryData<TData>(scopeQueryKey(this, normalizePrecisionQueryKey(key)));
  }

  setData<TData>(key: PrecisionQueryKey, value: TData | ((current: TData | undefined) => TData | undefined)): TData | undefined {
    return getPrecisionQueryImplementation(this).setQueryData<TData>(scopeQueryKey(this, normalizePrecisionQueryKey(key)), value);
  }

  remove(key: PrecisionQueryKey): void {
    getPrecisionQueryImplementation(this).removeQueries({ queryKey: scopeQueryKey(this, normalizePrecisionQueryKey(key)), exact: true });
  }

  async invalidate(key?: PrecisionQueryKey, options: PrecisionInvalidateOptions = {}): Promise<void> {
    await getPrecisionQueryImplementation(this).invalidateQueries({
      queryKey: key ? scopeQueryKey(this, normalizePrecisionQueryKey(key)) : scopeRootKey(this),
      exact: options.exact ?? false,
      refetchType: options.refetch ?? 'active',
    });
  }

  async refetch(key: PrecisionQueryKey, options: { exact?: boolean | undefined; type?: 'active' | 'all' | undefined } = {}): Promise<void> {
    await getPrecisionQueryImplementation(this).refetchQueries({
      queryKey: scopeQueryKey(this, normalizePrecisionQueryKey(key)),
      exact: options.exact ?? true,
      type: options.type ?? 'active',
    });
  }

  async cancel(key?: PrecisionQueryKey): Promise<void> {
    await getPrecisionQueryImplementation(this).cancelQueries({
      queryKey: key ? scopeQueryKey(this, normalizePrecisionQueryKey(key)) : scopeRootKey(this),
    }, { silent: true, revert: true });
  }

  /** Clears all query and mutation state before adopting a new identity scope. */
  resetScope(scope: PrecisionServerStateScope): boolean {
    const next = normalizeScope(scope);
    if (precisionServerStateScopeId(next) === precisionServerStateScopeId(this.#scope)) return false;
    getPrecisionQueryImplementation(this).clear();
    this.#scope = next;
    return true;
  }

  clear(): void { getPrecisionQueryImplementation(this).clear(); }
  getQueryCount(): number { return getPrecisionQueryImplementation(this).getQueryCache().getAll().length; }
  subscribe(listener: () => void): () => void { return getPrecisionQueryImplementation(this).getQueryCache().subscribe(listener); }
}

export function createPrecisionServerStateClient(scope?: PrecisionServerStateScope, config?: PrecisionServerStateConfig): PrecisionServerStateClient {
  return new PrecisionServerStateClient(scope, config);
}

export function precisionServerStateScopeId(scope: PrecisionServerStateScope): string {
  const normalized = normalizeScope(scope);
  return JSON.stringify([normalized.kind, normalized.id ?? 'default', normalized.revision ?? 0]);
}

export function getPrecisionQueryImplementation(client: PrecisionServerStateClient): QueryClient {
  const implementation = implementations.get(client);
  if (!implementation) throw new Error('Unknown Precision server-state client.');
  return implementation;
}

export function scopeQueryKey(client: PrecisionServerStateClient, key: PrecisionQueryKey): QueryKey {
  return [...scopeRootKey(client), ...key];
}

function scopeRootKey(client: PrecisionServerStateClient): QueryKey {
  const scope = client.scope;
  return ['precision-server-state', scope.kind, scope.id ?? 'default', scope.revision ?? 0];
}

function normalizeScope(scope: PrecisionServerStateScope): PrecisionServerStateScope {
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
