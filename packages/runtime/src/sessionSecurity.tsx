import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import type {
  SessionLockReason,
  SessionSecurityAdapter,
  SessionSecurityState,
  SessionSecurityStatus,
  SessionUnlockResult,
} from '@precision-calm/session-security';

export interface PrecisionSessionSecurityRuntime extends SessionSecurityState {
  status: SessionSecurityStatus;
  errorCode: 'session_security_unavailable' | null;
  refresh(): Promise<void>;
  lock(reason?: SessionLockReason): Promise<boolean>;
  requestUnlock(): Promise<SessionUnlockResult>;
}

const PrecisionSessionSecurityContext = createContext<PrecisionSessionSecurityRuntime | null>(null);

export function PrecisionSessionSecurityProvider({ adapter, children }: PropsWithChildren<{ adapter: SessionSecurityAdapter }>) {
  const [status, setStatus] = useState<SessionSecurityStatus>('loading');
  const [state, setState] = useState<SessionSecurityState>({ locked: true, reason: 'security-policy' });
  const [errorCode, setErrorCode] = useState<'session_security_unavailable' | null>(null);
  const mounted = useRef(true);
  const operationRevision = useRef(0);
  const subscriptionRevision = useRef(0);
  const lockRequest = useRef<Promise<boolean> | null>(null);
  const unlockRequest = useRef<Promise<SessionUnlockResult> | null>(null);

  const apply = useCallback((next: SessionSecurityState) => {
    if (!mounted.current) return;
    setState({ locked: next.locked, reason: next.locked ? next.reason : null });
    setStatus('ready');
    setErrorCode(null);
  }, []);

  const refresh = useCallback(async () => {
    const operationAtStart = ++operationRevision.current;
    const subscriptionAtStart = subscriptionRevision.current;
    if (mounted.current) { setStatus('loading'); setErrorCode(null); }
    try {
      const next = await adapter.getState();
      if (mounted.current && operationAtStart === operationRevision.current && subscriptionAtStart === subscriptionRevision.current) apply(next);
    } catch {
      if (!mounted.current || operationAtStart !== operationRevision.current || subscriptionAtStart !== subscriptionRevision.current) return;
      // Fail closed: authenticated content remains locked while security state is unknown.
      setState({ locked: true, reason: 'security-policy' });
      setStatus('error');
      setErrorCode('session_security_unavailable');
    }
  }, [adapter, apply]);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = adapter.subscribe((next) => {
      subscriptionRevision.current += 1;
      apply(next);
    });
    void refresh();
    return () => {
      mounted.current = false;
      operationRevision.current += 1;
      subscriptionRevision.current += 1;
      lockRequest.current = null;
      unlockRequest.current = null;
      unsubscribe();
    };
  }, [adapter, apply, refresh]);

  const lock = useCallback((reason: SessionLockReason = 'manual') => {
    if (lockRequest.current) return lockRequest.current;
    const operationAtStart = ++operationRevision.current;
    const subscriptionAtStart = subscriptionRevision.current;
    const promise = (async () => {
      try {
        await adapter.lock(reason);
        if (mounted.current && operationAtStart === operationRevision.current) {
          if (subscriptionAtStart === subscriptionRevision.current) apply({ locked: true, reason });
          return true;
        }
        return false;
      } catch {
        if (mounted.current && operationAtStart === operationRevision.current) { setState({ locked: true, reason: 'security-policy' }); setStatus('error'); setErrorCode('session_security_unavailable'); }
        return false;
      }
    })();
    lockRequest.current = promise;
    void promise.finally(() => { if (lockRequest.current === promise) lockRequest.current = null; });
    return promise;
  }, [adapter, apply]);

  const requestUnlock = useCallback(() => {
    if (unlockRequest.current) return unlockRequest.current;
    const operationAtStart = ++operationRevision.current;
    const subscriptionAtStart = subscriptionRevision.current;
    const promise = (async () => {
      try {
        const result = await adapter.requestUnlock();
        if (operationAtStart !== operationRevision.current || !mounted.current) return 'error' as const;
        if (result === 'unlocked' && subscriptionAtStart === subscriptionRevision.current) apply({ locked: false, reason: null });
        else if (result === 'error') {
          setState({ locked: true, reason: 'security-policy' });
          setStatus('error');
          setErrorCode('session_security_unavailable');
        }
        return result;
      } catch {
        if (mounted.current && operationAtStart === operationRevision.current) {
          setState({ locked: true, reason: 'security-policy' });
          setStatus('error');
          setErrorCode('session_security_unavailable');
        }
        return 'error' as const;
      }
    })();
    unlockRequest.current = promise;
    void promise.finally(() => { if (unlockRequest.current === promise) unlockRequest.current = null; });
    return promise;
  }, [adapter, apply]);

  const value = useMemo<PrecisionSessionSecurityRuntime>(() => ({ ...state, status, errorCode, refresh, lock, requestUnlock }), [state, status, errorCode, refresh, lock, requestUnlock]);
  return <PrecisionSessionSecurityContext.Provider value={value}>{children}</PrecisionSessionSecurityContext.Provider>;
}


export interface PrecisionSessionSecurityBootstrapProps extends PropsWithChildren {
  /** Rendered only while the first local-security resolution is pending. */
  fallback?: ReactNode;
}

/**
 * Holds the application navigator out of the tree until local session security
 * resolves once. Expo Router removes inactive Stack.Protected screens from
 * history, so mounting protected navigation during an extra security-loading
 * pass would destroy cold/direct-entry intent. The security provider itself
 * remains mounted and fail-closed while this boundary shows the fallback.
 *
 * After the initial resolution this boundary stays transparent. Later lock or
 * error transitions continue through the normal protected-route state machine.
 */
export function PrecisionSessionSecurityBootstrap({ children, fallback = null }: PrecisionSessionSecurityBootstrapProps) {
  const runtime = useOptionalPrecisionSessionSecurity();
  const resolvedOnce = useRef(runtime ? runtime.status !== 'loading' : true);
  if (runtime && runtime.status !== 'loading') resolvedOnce.current = true;
  if (!resolvedOnce.current) return fallback;
  return children;
}

export function useOptionalPrecisionSessionSecurity(): PrecisionSessionSecurityRuntime | null {
  return useContext(PrecisionSessionSecurityContext);
}

export function usePrecisionSessionSecurity(): PrecisionSessionSecurityRuntime {
  const runtime = useOptionalPrecisionSessionSecurity();
  if (!runtime) throw new Error('usePrecisionSessionSecurity requires PrecisionRuntimeProvider with sessionSecurity configured.');
  return runtime;
}
