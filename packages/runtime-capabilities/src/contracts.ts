import type { ExpoBaseCapabilityAvailability } from '@expo-base/capabilities';

export const expoBaseConnectivityCapability = 'connectivity';
export const expoBaseAppLifecycleCapability = 'appLifecycle';

export type ExpoBaseConnectivityStatus = 'online' | 'offline' | 'unknown';

export interface ExpoBaseConnectivityState {
  status: ExpoBaseConnectivityStatus;
  /** Browser/OS reachability is a hint, not proof that a service endpoint is usable. */
  internetReachable: boolean | null;
}

export interface ExpoBaseConnectivity {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  getState(): Promise<ExpoBaseConnectivityState>;
  subscribe(listener: (state: ExpoBaseConnectivityState) => void): () => void;
}

export type ExpoBaseAppLifecycleState = 'active' | 'inactive' | 'background' | 'unknown';

export interface ExpoBaseAppLifecycle {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  getState(): ExpoBaseAppLifecycleState;
  subscribe(listener: (state: ExpoBaseAppLifecycleState) => void): () => void;
}

export interface ExpoBaseServerStateRuntimePolicy {
  /** Defaults to false. Enable only when the product wants active queries refreshed after a real reconnect. */
  refetchOnReconnect?: boolean | undefined;
  /** Defaults to false. Enable only when the product wants active queries refreshed after foregrounding. */
  refetchOnForeground?: boolean | undefined;
}
