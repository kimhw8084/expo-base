import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { AuthAdapter, AuthSession } from '@precision-calm/adapters';
import {
  createReturnIntentChannel,
  deriveProtectedAccess,
  isSessionFetchCurrent,
  type AuthActionStatus,
  type AuthResolutionStatus,
  type ProtectedAccessState,
  type ReturnIntentChannel,
  type ReturnIntentPolicy,
  type SafeAuthErrorCode,
} from '@precision-calm/auth';
import { useOptionalPrecisionSessionSecurity, type PrecisionSessionSecurityRuntime } from './sessionSecurity';

export interface PrecisionAuthSnapshot {
  status: AuthResolutionStatus;
  session: AuthSession | null;
  /** Increments whenever an authoritative session snapshot is applied. */
  sessionRevision: number;
  actionStatus: AuthActionStatus;
  errorCode: SafeAuthErrorCode | null;
  pendingReturnIntent: `/${string}` | null;
}

export interface PrecisionAuthRuntime extends PrecisionAuthSnapshot {
  refresh(): Promise<void>;
  signIn(input: { email: string; password: string }): Promise<boolean>;
  signOut(): Promise<boolean>;
  captureReturnIntent(path: string): boolean;
  clearReturnIntent(): void;
  consumeReturnIntent(fallback?: `/${string}`): `/${string}`;
}

const PrecisionAuthContext = createContext<PrecisionAuthRuntime | null>(null);

export interface PrecisionAuthProviderProps extends PropsWithChildren {
  adapter: AuthAdapter;
  returnIntentPolicy?: ReturnIntentPolicy;
  /** Optional shared in-memory channel for native incoming-link return intent. */
  returnIntentChannel?: ReturnIntentChannel;
}

/**
 * Owns initial session resolution and subscription ordering. Product screens
 * never infer authentication from a nullable session while loading is pending.
 */
export function PrecisionAuthProvider({ adapter, returnIntentPolicy, returnIntentChannel, children }: PrecisionAuthProviderProps) {
  const localReturnChannel = useRef<ReturnIntentChannel | null>(null);
  const localChannel = localReturnChannel.current ?? createReturnIntentChannel(returnIntentPolicy);
  if (!localReturnChannel.current) localReturnChannel.current = localChannel;
  const returnChannel = returnIntentChannel ?? localChannel;
  const [snapshot, setSnapshot] = useState<PrecisionAuthSnapshot>({
    status: 'loading', session: null, sessionRevision: 0, actionStatus: 'idle', errorCode: null, pendingReturnIntent: returnChannel.peek(),
  });
  const mounted = useRef(true);
  const subscriptionRevision = useRef(0);
  const requestRevision = useRef(0);
  const activeAction = useRef<{ kind: 'sign-in' | 'sign-out'; promise: Promise<boolean> } | null>(null);
  const refreshRequest = useRef<Promise<void> | null>(null);

  const applySession = useCallback((session: AuthSession | null) => {
    if (!mounted.current) return;
    setSnapshot((current) => ({
      ...current,
      status: session ? 'signed-in' : 'signed-out',
      session,
      sessionRevision: current.sessionRevision + 1,
      actionStatus: 'idle',
      errorCode: null,
    }));
  }, []);

  const resolveSession = useCallback(async (actionStatus: AuthActionStatus, errorCode: SafeAuthErrorCode) => {
    const requestAtStart = ++requestRevision.current;
    const revisionAtStart = subscriptionRevision.current;
    if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus, errorCode: null, ...(current.status === 'error' ? { status: 'loading' as const } : {}) }));
    try {
      const session = await adapter.getSession();
      // A newer subscription event is authoritative and must not be overwritten
      // by a slower getSession() result.
      if (requestAtStart === requestRevision.current && isSessionFetchCurrent(revisionAtStart, subscriptionRevision.current)) applySession(session);
      else if (mounted.current && requestAtStart === requestRevision.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle' }));
    } catch {
      if (!mounted.current || requestAtStart !== requestRevision.current || subscriptionRevision.current !== revisionAtStart) return;
      setSnapshot((current) => ({ ...current, status: 'error', session: null, actionStatus: 'idle', errorCode }));
    }
  }, [adapter, applySession]);

  const startRefresh = useCallback((errorCode: SafeAuthErrorCode) => {
    if (refreshRequest.current) return refreshRequest.current;
    const promise = resolveSession('refreshing', errorCode);
    refreshRequest.current = promise;
    void promise.finally(() => { if (refreshRequest.current === promise) refreshRequest.current = null; });
    return promise;
  }, [resolveSession]);

  useEffect(() => returnChannel.subscribe((pendingReturnIntent) => {
    if (mounted.current) setSnapshot((current) => current.pendingReturnIntent === pendingReturnIntent ? current : ({ ...current, pendingReturnIntent }));
  }), [returnChannel]);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = adapter.subscribe((session) => {
      subscriptionRevision.current += 1;
      requestRevision.current += 1;
      applySession(session);
    });
    void startRefresh('session_unavailable');
    return () => {
      mounted.current = false;
      requestRevision.current += 1;
      activeAction.current = null;
      refreshRequest.current = null;
      unsubscribe();
    };
  }, [adapter, applySession, startRefresh]);

  const refresh = useCallback(() => startRefresh('refresh_failed'), [startRefresh]);
  const signIn = useCallback((input: { email: string; password: string }) => {
    const currentAction = activeAction.current;
    if (currentAction) return currentAction.kind === 'sign-in' ? currentAction.promise : Promise.resolve(false);
    const requestAtStart = ++requestRevision.current;
    const subscriptionAtStart = subscriptionRevision.current;
    if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'signing-in', errorCode: null }));
    const promise = (async () => {
      try {
        const session = await adapter.signIn(input);
        if (requestAtStart === requestRevision.current && subscriptionAtStart === subscriptionRevision.current) applySession(session);
        else if (mounted.current && requestAtStart === requestRevision.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle' }));
        return true;
      } catch {
        if (mounted.current && requestAtStart === requestRevision.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle', errorCode: 'sign_in_failed' }));
        return false;
      }
    })();
    activeAction.current = { kind: 'sign-in', promise };
    void promise.finally(() => { if (activeAction.current?.promise === promise) activeAction.current = null; });
    return promise;
  }, [adapter, applySession]);
  const signOut = useCallback(() => {
    const currentAction = activeAction.current;
    if (currentAction) return currentAction.kind === 'sign-out' ? currentAction.promise : Promise.resolve(false);
    const requestAtStart = ++requestRevision.current;
    const subscriptionAtStart = subscriptionRevision.current;
    if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'signing-out', errorCode: null }));
    const promise = (async () => {
      try {
        await adapter.signOut();
        if (requestAtStart === requestRevision.current && subscriptionAtStart === subscriptionRevision.current) applySession(null);
        else if (mounted.current && requestAtStart === requestRevision.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle' }));
        return true;
      } catch {
        if (mounted.current && requestAtStart === requestRevision.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle', errorCode: 'sign_out_failed' }));
        return false;
      }
    })();
    activeAction.current = { kind: 'sign-out', promise };
    void promise.finally(() => { if (activeAction.current?.promise === promise) activeAction.current = null; });
    return promise;
  }, [adapter, applySession]);
  const captureReturnIntent = useCallback((path: string) => returnChannel.capture(path), [returnChannel]);
  const clearReturnIntent = useCallback(() => returnChannel.clear(), [returnChannel]);
  const consumeReturnIntent = useCallback((fallback: `/${string}` = '/') => returnChannel.consume(fallback), [returnChannel]);

  const runtime = useMemo<PrecisionAuthRuntime>(() => ({
    ...snapshot, refresh, signIn, signOut, captureReturnIntent, clearReturnIntent, consumeReturnIntent,
  }), [snapshot, refresh, signIn, signOut, captureReturnIntent, clearReturnIntent, consumeReturnIntent]);

  return <PrecisionAuthContext.Provider value={runtime}>{children}</PrecisionAuthContext.Provider>;
}

export function usePrecisionAuth(): PrecisionAuthRuntime {
  const auth = useContext(PrecisionAuthContext);
  if (!auth) throw new Error('usePrecisionAuth requires PrecisionRuntimeProvider with services/auth enabled.');
  return auth;
}

export function deriveRuntimeProtectedAccess(
  authStatus: AuthResolutionStatus,
  sessionSecurity: Pick<PrecisionSessionSecurityRuntime, 'status' | 'locked'> | null,
  options: { locallyLocked?: boolean } = {},
): ProtectedAccessState {
  // A later local-security revalidation is fail-closed without pretending an
  // explicit lock occurred. Initial local-security resolution is held outside
  // the navigator by PrecisionSessionSecurityBootstrap so cold/direct-entry
  // routes are never registered and then removed by Stack.Protected.
  if (authStatus === 'signed-in' && sessionSecurity?.status === 'loading') return 'booting';

  const runtimeLocked = sessionSecurity
    ? sessionSecurity.status === 'error' || sessionSecurity.locked
    : false;
  const locallyLocked = runtimeLocked || options.locallyLocked === true;
  return deriveProtectedAccess(authStatus, { locallyLocked });
}

export function usePrecisionAuthAccess(options: { locallyLocked?: boolean } = {}): ProtectedAccessState {
  const { status } = usePrecisionAuth();
  const sessionSecurity = useOptionalPrecisionSessionSecurity();
  return deriveRuntimeProtectedAccess(status, sessionSecurity, options);
}
