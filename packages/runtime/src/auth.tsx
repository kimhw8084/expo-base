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

export interface PrecisionAuthSnapshot {
  status: AuthResolutionStatus;
  session: AuthSession | null;
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
    status: 'loading', session: null, actionStatus: 'idle', errorCode: null, pendingReturnIntent: returnChannel.peek(),
  });
  const mounted = useRef(true);
  const subscriptionRevision = useRef(0);

  const applySession = useCallback((session: AuthSession | null) => {
    if (!mounted.current) return;
    setSnapshot((current) => ({
      ...current,
      status: session ? 'signed-in' : 'signed-out',
      session,
      actionStatus: 'idle',
      errorCode: null,
    }));
  }, []);

  const resolveSession = useCallback(async (actionStatus: AuthActionStatus, errorCode: SafeAuthErrorCode) => {
    const revisionAtStart = subscriptionRevision.current;
    if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus, errorCode: null, ...(current.status === 'error' ? { status: 'loading' as const } : {}) }));
    try {
      const session = await adapter.getSession();
      // A newer subscription event is authoritative and must not be overwritten
      // by a slower getSession() result.
      if (isSessionFetchCurrent(revisionAtStart, subscriptionRevision.current)) applySession(session);
      else if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle' }));
    } catch {
      if (!mounted.current || subscriptionRevision.current !== revisionAtStart) return;
      setSnapshot((current) => ({ ...current, status: 'error', session: null, actionStatus: 'idle', errorCode }));
    }
  }, [adapter, applySession]);

  useEffect(() => returnChannel.subscribe((pendingReturnIntent) => {
    if (mounted.current) setSnapshot((current) => current.pendingReturnIntent === pendingReturnIntent ? current : ({ ...current, pendingReturnIntent }));
  }), [returnChannel]);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = adapter.subscribe((session) => {
      subscriptionRevision.current += 1;
      applySession(session);
    });
    void resolveSession('refreshing', 'session_unavailable');
    return () => { mounted.current = false; unsubscribe(); };
  }, [adapter, applySession, resolveSession]);

  const refresh = useCallback(async () => { await resolveSession('refreshing', 'refresh_failed'); }, [resolveSession]);
  const signIn = useCallback(async (input: { email: string; password: string }) => {
    if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'signing-in', errorCode: null }));
    try { const session = await adapter.signIn(input); applySession(session); return true; }
    catch { if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle', errorCode: 'sign_in_failed' })); return false; }
  }, [adapter, applySession]);
  const signOut = useCallback(async () => {
    if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'signing-out', errorCode: null }));
    try { await adapter.signOut(); applySession(null); return true; }
    catch { if (mounted.current) setSnapshot((current) => ({ ...current, actionStatus: 'idle', errorCode: 'sign_out_failed' })); return false; }
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

export function usePrecisionAuthAccess(options: { locallyLocked?: boolean } = {}): ProtectedAccessState {
  const { status } = usePrecisionAuth();
  return deriveProtectedAccess(status, options);
}
