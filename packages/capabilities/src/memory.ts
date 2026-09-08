import type { PrecisionCapabilityResult, PrecisionPermissionAdapter, PrecisionPermissionSnapshot } from './contracts';

/** Deterministic permission adapter for tests and non-hardware reference demonstrations. */
export class MemoryPermissionAdapter implements PrecisionPermissionAdapter {
  #snapshot: PrecisionPermissionSnapshot;
  #requested: PrecisionPermissionSnapshot | null = null;

  constructor(initial: Partial<PrecisionPermissionSnapshot> = {}) {
    this.#snapshot = { status: initial.status ?? 'undetermined', canAskAgain: initial.canAskAgain ?? true, canOpenSettings: initial.canOpenSettings ?? false };
  }

  async get(): Promise<PrecisionPermissionSnapshot> { return { ...this.#snapshot }; }
  async request(): Promise<PrecisionPermissionSnapshot> {
    if (this.#requested) this.#snapshot = this.#requested;
    return { ...this.#snapshot };
  }
  async openSettings(): Promise<PrecisionCapabilityResult<undefined>> {
    return this.#snapshot.canOpenSettings ? { status: 'success', value: undefined } : { status: 'unavailable', reason: 'unsupported' };
  }
  set(snapshot: Partial<PrecisionPermissionSnapshot>): void { this.#snapshot = { ...this.#snapshot, ...snapshot }; }
  setRequestResult(snapshot: PrecisionPermissionSnapshot): void { this.#requested = { ...snapshot }; }
}
