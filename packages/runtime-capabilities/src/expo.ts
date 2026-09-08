import * as Network from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';
import type { PrecisionCapabilityAvailability } from '@precision-calm/capabilities';
import type { PrecisionAppLifecycle, PrecisionAppLifecycleState, PrecisionConnectivity, PrecisionConnectivityState } from './contracts';

export class ExpoConnectivity implements PrecisionConnectivity {
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async getState(): Promise<PrecisionConnectivityState> {
    try { return normalizeNetworkState(await Network.getNetworkStateAsync()); }
    catch { return { status: 'unknown', internetReachable: null }; }
  }
  subscribe(listener: (state: PrecisionConnectivityState) => void): () => void {
    const subscription = Network.addNetworkStateListener((state) => listener(normalizeNetworkState(state)));
    return () => subscription.remove();
  }
}

export class ReactNativeAppLifecycle implements PrecisionAppLifecycle {
  #state: PrecisionAppLifecycleState = normalizeAppState(AppState.currentState);
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  getState(): PrecisionAppLifecycleState { return this.#state; }
  subscribe(listener: (state: PrecisionAppLifecycleState) => void): () => void {
    const subscription = AppState.addEventListener('change', (state) => {
      this.#state = normalizeAppState(state);
      listener(this.#state);
    });
    listener(this.#state);
    return () => subscription.remove();
  }
}

function normalizeNetworkState(state: Network.NetworkState): PrecisionConnectivityState {
  return {
    status: state.isConnected === true && state.isInternetReachable !== false ? 'online' : state.isConnected === false || state.isInternetReachable === false ? 'offline' : 'unknown',
    internetReachable: state.isInternetReachable ?? null,
  };
}

function normalizeAppState(state: AppStateStatus): PrecisionAppLifecycleState {
  if (state === 'active' || state === 'inactive' || state === 'background') return state;
  return 'unknown';
}
