import type { ReactNode } from 'react';
import { AsyncStateView } from '@precision-calm/feedback';
import { toPrecisionAsyncState, type PrecisionQueryResult } from '@precision-calm/server-state';

export interface ServerStateContentProps<TData> {
  query: PrecisionQueryResult<TData>;
  itemCount: number;
  children: ReactNode;
  empty?: ReactNode | undefined;
}

/**
 * The sanctioned presentation bridge between a query lifecycle and shared
 * loading/empty/error/stale anatomy. Domain copy stays in the supplied slots.
 */
export function ServerStateContent<TData>({ query, itemCount, children, empty }: ServerStateContentProps<TData>) {
  const state = toPrecisionAsyncState(query.state, itemCount);
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
