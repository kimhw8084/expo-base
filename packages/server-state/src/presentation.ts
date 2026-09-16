import type { ExpoBaseQueryState } from './useExpoBaseQuery';

export interface ExpoBaseAsyncStateMapping {
  loading: boolean;
  error: unknown;
  itemCount: number;
}

/** Maps query lifecycle to AsyncStateView without taking ownership of product copy. */
export function toExpoBaseAsyncState<TData>(state: ExpoBaseQueryState<TData>, itemCount: number): ExpoBaseAsyncStateMapping {
  const count = Number.isFinite(itemCount) ? Math.max(0, Math.trunc(itemCount)) : 0;
  if (state.kind === 'initial-loading') return { loading: true, error: null, itemCount: 0 };
  if (state.kind === 'error') return { loading: false, error: state.error, itemCount: 0 };
  if (state.kind === 'content') return {
    loading: state.refresh.status === 'refreshing',
    error: state.refresh.status === 'error' ? state.refresh.error : null,
    itemCount: count,
  };
  return { loading: false, error: null, itemCount: count };
}
