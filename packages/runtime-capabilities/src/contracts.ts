import type { PrecisionCapabilityAvailability } from '@precision-calm/capabilities';

export const precisionConnectivityCapability = 'connectivity';
export const precisionAppLifecycleCapability = 'appLifecycle';

export type PrecisionConnectivityStatus = 'online' | 'offline' | 'unknown';

export interface PrecisionConnectivityState {
  status: PrecisionConnectivityStatus;
  /** Browser/OS reachability is a hint, not proof that a service endpoint is usable. */
  internetReachable: boolean | null;
}

export interface PrecisionConnectivity {
  availability(): Promise<PrecisionCapabilityAvailability>;
  getState(): Promise<PrecisionConnectivityState>;
  subscribe(listener: (state: PrecisionConnectivityState) => void): () => void;
}

export type PrecisionAppLifecycleState = 'active' | 'inactive' | 'background' | 'unknown';

export interface PrecisionAppLifecycle {
  availability(): Promise<PrecisionCapabilityAvailability>;
  getState(): PrecisionAppLifecycleState;
  subscribe(listener: (state: PrecisionAppLifecycleState) => void): () => void;
}

export interface PrecisionServerStateRuntimePolicy {
  /** Defaults to false. Enable only when the product wants active queries refreshed after a real reconnect. */
  refetchOnReconnect?: boolean | undefined;
  /** Defaults to false. Enable only when the product wants active queries refreshed after foregrounding. */
  refetchOnForeground?: boolean | undefined;
}
