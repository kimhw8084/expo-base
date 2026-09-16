import type { ExpoBaseCapabilityResult, ExpoBasePermissionAdapter, ExpoBasePermissionSnapshot } from './contracts';

/** Deterministic permission adapter for tests and non-hardware reference demonstrations. */
export class MemoryPermissionAdapter implements ExpoBasePermissionAdapter {
  #snapshot: ExpoBasePermissionSnapshot;
  #requested: ExpoBasePermissionSnapshot | null = null;

  constructor(initial: Partial<ExpoBasePermissionSnapshot> = {}) {
    this.#snapshot = { status: initial.status ?? 'undetermined', canAskAgain: initial.canAskAgain ?? true, canOpenSettings: initial.canOpenSettings ?? false };
  }

  async get(): Promise<ExpoBasePermissionSnapshot> { return { ...this.#snapshot }; }
  async request(): Promise<ExpoBasePermissionSnapshot> {
    if (this.#requested) this.#snapshot = this.#requested;
    return { ...this.#snapshot };
  }
  async openSettings(): Promise<ExpoBaseCapabilityResult<undefined>> {
    return this.#snapshot.canOpenSettings ? { status: 'success', value: undefined } : { status: 'unavailable', reason: 'unsupported' };
  }
  set(snapshot: Partial<ExpoBasePermissionSnapshot>): void { this.#snapshot = { ...this.#snapshot, ...snapshot }; }
  setRequestResult(snapshot: ExpoBasePermissionSnapshot): void { this.#requested = { ...snapshot }; }
}
