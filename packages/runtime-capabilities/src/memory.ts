import type { ExpoBaseCapabilityAvailability } from '@expo-base/capabilities';
import type { ExpoBaseAppLifecycle, ExpoBaseAppLifecycleState, ExpoBaseConnectivity, ExpoBaseConnectivityState } from './contracts';

export class MemoryConnectivity implements ExpoBaseConnectivity {
  #state: ExpoBaseConnectivityState;
  #listeners = new Set<(state: ExpoBaseConnectivityState) => void>();

  constructor(initial: Partial<ExpoBaseConnectivityState> = {}) {
    this.#state = { status: initial.status ?? 'unknown', internetReachable: initial.internetReachable ?? null };
  }

  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  async getState(): Promise<ExpoBaseConnectivityState> { return { ...this.#state }; }
  subscribe(listener: (state: ExpoBaseConnectivityState) => void): () => void {
    this.#listeners.add(listener);
    listener({ ...this.#state });
    return () => this.#listeners.delete(listener);
  }
  setState(next: Partial<ExpoBaseConnectivityState>): void {
    this.#state = { ...this.#state, ...next };
    for (const listener of this.#listeners) listener({ ...this.#state });
  }
}

export class MemoryAppLifecycle implements ExpoBaseAppLifecycle {
  #state: ExpoBaseAppLifecycleState;
  #listeners = new Set<(state: ExpoBaseAppLifecycleState) => void>();

  constructor(initial: ExpoBaseAppLifecycleState = 'active') { this.#state = initial; }
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  getState(): ExpoBaseAppLifecycleState { return this.#state; }
  subscribe(listener: (state: ExpoBaseAppLifecycleState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  setState(next: ExpoBaseAppLifecycleState): void {
    this.#state = next;
    for (const listener of this.#listeners) listener(next);
  }
}
