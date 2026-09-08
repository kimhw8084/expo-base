import type { PrecisionCapabilityAvailability } from '@precision-calm/capabilities';
import type { PrecisionAppLifecycle, PrecisionAppLifecycleState, PrecisionConnectivity, PrecisionConnectivityState } from './contracts';

export class MemoryConnectivity implements PrecisionConnectivity {
  #state: PrecisionConnectivityState;
  #listeners = new Set<(state: PrecisionConnectivityState) => void>();

  constructor(initial: Partial<PrecisionConnectivityState> = {}) {
    this.#state = { status: initial.status ?? 'unknown', internetReachable: initial.internetReachable ?? null };
  }

  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async getState(): Promise<PrecisionConnectivityState> { return { ...this.#state }; }
  subscribe(listener: (state: PrecisionConnectivityState) => void): () => void {
    this.#listeners.add(listener);
    listener({ ...this.#state });
    return () => this.#listeners.delete(listener);
  }
  setState(next: Partial<PrecisionConnectivityState>): void {
    this.#state = { ...this.#state, ...next };
    for (const listener of this.#listeners) listener({ ...this.#state });
  }
}

export class MemoryAppLifecycle implements PrecisionAppLifecycle {
  #state: PrecisionAppLifecycleState;
  #listeners = new Set<(state: PrecisionAppLifecycleState) => void>();

  constructor(initial: PrecisionAppLifecycleState = 'active') { this.#state = initial; }
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  getState(): PrecisionAppLifecycleState { return this.#state; }
  subscribe(listener: (state: PrecisionAppLifecycleState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  setState(next: PrecisionAppLifecycleState): void {
    this.#state = next;
    for (const listener of this.#listeners) listener(next);
  }
}
