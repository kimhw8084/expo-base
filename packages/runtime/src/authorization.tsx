import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import type { AuthorizationAdapter } from '@precision-calm/adapters';
import {
  evaluateCapabilityRequirement,
  isCapabilityFetchCurrent,
  normalizeCapabilities,
  type AuthorizationDecision,
  type AuthorizationStatus,
  type CapabilityRequirement,
} from '@precision-calm/authorization';
import { usePrecisionAuth } from './auth';

export interface PrecisionAuthorizationRuntime {
  status: AuthorizationStatus;
  capabilities: readonly string[];
  errorCode: 'capabilities_unavailable' | null;
  refresh(): Promise<void>;
  evaluate(requirement: CapabilityRequirement): AuthorizationDecision;
}

const PrecisionAuthorizationContext = createContext<PrecisionAuthorizationRuntime | null>(null);

export function PrecisionAuthorizationProvider({ adapter, children }: PropsWithChildren<{ adapter: AuthorizationAdapter }>) {
  const auth = usePrecisionAuth();
  const userId = auth.status === 'signed-in' ? auth.session?.user.id ?? null : null;
  const [status, setStatus] = useState<AuthorizationStatus>(userId ? 'loading' : 'inactive');
  const [capabilities, setCapabilities] = useState<readonly string[]>([]);
  const [errorCode, setErrorCode] = useState<'capabilities_unavailable' | null>(null);
  const revision = useRef(0);
  const mounted = useRef(true);

  const apply = useCallback((values: readonly string[]) => {
    if (!mounted.current) return;
    setCapabilities(normalizeCapabilities(values)); setStatus('ready'); setErrorCode(null);
  }, []);

  const fetchFor = useCallback(async (targetUserId: string) => {
    const started = revision.current;
    if (mounted.current) { setStatus('loading'); setErrorCode(null); }
    try {
      const values = await adapter.getCapabilities(targetUserId);
      if (isCapabilityFetchCurrent(started, revision.current)) apply(values);
    } catch {
      if (!mounted.current || !isCapabilityFetchCurrent(started, revision.current)) return;
      setCapabilities([]); setStatus('error'); setErrorCode('capabilities_unavailable');
    }
  }, [adapter, apply]);

  useEffect(() => {
    mounted.current = true;
    if (!userId) { setCapabilities([]); setStatus('inactive'); setErrorCode(null); return; }
    const unsubscribe = adapter.subscribe?.(userId, (values) => { revision.current += 1; apply(values); });
    void fetchFor(userId);
    return () => { unsubscribe?.(); };
  }, [adapter, apply, fetchFor, userId]);

  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => { if (userId) await fetchFor(userId); }, [fetchFor, userId]);
  const evaluate = useCallback((requirement: CapabilityRequirement) => evaluateCapabilityRequirement({ status, capabilities }, requirement), [status, capabilities]);
  const value = useMemo<PrecisionAuthorizationRuntime>(() => ({ status, capabilities, errorCode, refresh, evaluate }), [status, capabilities, errorCode, refresh, evaluate]);
  return <PrecisionAuthorizationContext.Provider value={value}>{children}</PrecisionAuthorizationContext.Provider>;
}

export function usePrecisionAuthorization(): PrecisionAuthorizationRuntime {
  const authorization = useContext(PrecisionAuthorizationContext);
  if (!authorization) throw new Error('usePrecisionAuthorization requires PrecisionRuntimeProvider with services/authorization enabled.');
  return authorization;
}

export function usePrecisionAuthorizationRequirement(requirement: CapabilityRequirement): AuthorizationDecision {
  return usePrecisionAuthorization().evaluate(requirement);
}

export function CapabilityGate({ requirement, fallback = null, children }: { requirement: CapabilityRequirement; fallback?: ReactNode; children: ReactNode }) {
  const decision = usePrecisionAuthorizationRequirement(requirement);
  return decision.allowed ? <>{children}</> : <>{fallback}</>;
}
