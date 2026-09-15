import { useCallback, useEffect, useRef, useState } from 'react';

export type ExpoBaseAsyncActionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ExpoBaseAsyncActionState {
  status: ExpoBaseAsyncActionStatus;
  error: unknown | null;
}

export interface ExpoBaseAsyncAction<TResult, TArgs extends readonly unknown[]> {
  state: ExpoBaseAsyncActionState;
  run(...args: TArgs): Promise<TResult | undefined>;
  reset(): void;
}

/**
 * Owns the lifecycle of one user-triggered async action. A second invocation
 * while the first is pending shares the first promise, and a reset/unmount
 * invalidates late completions without attempting to cancel an adapter that
 * may not support cancellation.
 */
export function useExpoBaseAsyncAction<TArgs extends readonly unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): ExpoBaseAsyncAction<TResult, TArgs> {
  const actionRef = useRef(action);
  actionRef.current = action;
  const mounted = useRef(true);
  const revision = useRef(0);
  const active = useRef<Promise<TResult | undefined> | null>(null);
  const [state, setState] = useState<ExpoBaseAsyncActionState>({ status: 'idle', error: null });

  useEffect(() => () => {
    mounted.current = false;
    revision.current += 1;
    active.current = null;
  }, []);

  const run = useCallback((...args: TArgs) => {
    if (active.current) return active.current;
    const started = ++revision.current;
    if (mounted.current) setState({ status: 'loading', error: null });

    const promise = (async () => {
      try {
        const value = await actionRef.current(...args);
        if (!mounted.current || started !== revision.current) return undefined;
        setState({ status: 'success', error: null });
        return value;
      } catch (error) {
        if (mounted.current && started === revision.current) setState({ status: 'error', error });
        return undefined;
      }
    })();

    active.current = promise;
    void promise.finally(() => { if (active.current === promise) active.current = null; });
    return promise;
  }, []);

  const reset = useCallback(() => {
    revision.current += 1;
    active.current = null;
    if (mounted.current) setState({ status: 'idle', error: null });
  }, []);

  return { state, run, reset };
}
