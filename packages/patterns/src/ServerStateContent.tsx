import type { ReactNode } from 'react';
import { AsyncStateView } from '@expo-base/feedback';
import { toExpoBaseAsyncState, type ExpoBaseQueryResult } from '@expo-base/server-state';

export interface ServerStateContentProps<TData> {
  query: ExpoBaseQueryResult<TData>;
  itemCount: number;
  children: ReactNode;
  empty?: ReactNode | undefined;
}

/**
 * The sanctioned presentation bridge between a query lifecycle and shared
 * loading/empty/error/stale anatomy. Domain copy stays in the supplied slots.
 */
export function ServerStateContent<TData>({ query, itemCount, children, empty }: ServerStateContentProps<TData>) {
  const state = toExpoBaseAsyncState(query.state, itemCount);
  return (
    <AsyncStateView
      {...state}
      onRetry={() => { void query.refresh(); }}
      {...(empty === undefined ? {} : { empty })}
    >
      {children}
    </AsyncStateView>
  );
}
