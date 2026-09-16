import * as Network from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';
import type { ExpoBaseCapabilityAvailability } from '@expo-base/capabilities';
import type { ExpoBaseAppLifecycle, ExpoBaseAppLifecycleState, ExpoBaseConnectivity, ExpoBaseConnectivityState } from './contracts';

export class ExpoConnectivity implements ExpoBaseConnectivity {
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  async getState(): Promise<ExpoBaseConnectivityState> {
    try { return normalizeNetworkState(await Network.getNetworkStateAsync()); }
    catch { return { status: 'unknown', internetReachable: null }; }
  }
  subscribe(listener: (state: ExpoBaseConnectivityState) => void): () => void {
    const subscription = Network.addNetworkStateListener((state) => listener(normalizeNetworkState(state)));
    return () => subscription.remove();
  }
}

export class ReactNativeAppLifecycle implements ExpoBaseAppLifecycle {
  #state: ExpoBaseAppLifecycleState = normalizeAppState(AppState.currentState);
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  getState(): ExpoBaseAppLifecycleState { return this.#state; }
  subscribe(listener: (state: ExpoBaseAppLifecycleState) => void): () => void {
    const subscription = AppState.addEventListener('change', (state) => {
      this.#state = normalizeAppState(state);
      listener(this.#state);
    });
    listener(this.#state);
    return () => subscription.remove();
  }
}

function normalizeNetworkState(state: Network.NetworkState): ExpoBaseConnectivityState {
  return {
    status: state.isConnected === true && state.isInternetReachable !== false ? 'online' : state.isConnected === false || state.isInternetReachable === false ? 'offline' : 'unknown',
    internetReachable: state.isInternetReachable ?? null,
  };
}

function normalizeAppState(state: AppStateStatus): ExpoBaseAppLifecycleState {
  if (state === 'active' || state === 'inactive' || state === 'background') return state;
  return 'unknown';
}
