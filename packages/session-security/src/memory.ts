import type {
  SessionLockReason,
  SessionSecurityAdapter,
  SessionSecurityListener,
  SessionSecurityState,
  SessionUnlockResult,
} from './contracts';

/** Deterministic adapter for reference apps/tests. Never use it as secure persistence. */
export class MemorySessionSecurityAdapter implements SessionSecurityAdapter {
  #state: SessionSecurityState;
  #listeners = new Set<SessionSecurityListener>();
  #unlockResult: SessionUnlockResult = 'unlocked';

  constructor(initial: Partial<SessionSecurityState> = {}) {
    this.#state = {
      locked: initial.locked ?? false,
      reason: initial.locked ? (initial.reason ?? 'manual') : null,
    };
  }

  async getState(): Promise<SessionSecurityState> {
    return { ...this.#state };
  }

  async lock(reason: SessionLockReason = 'manual'): Promise<void> {
    this.#state = { locked: true, reason };
    this.#emit();
  }

  async requestUnlock(): Promise<SessionUnlockResult> {
    if (this.#unlockResult !== 'unlocked') return this.#unlockResult;
    this.#state = { locked: false, reason: null };
    this.#emit();
    return 'unlocked';
  }

  subscribe(listener: SessionSecurityListener): () => void {
    this.#listeners.add(listener);
    listener({ ...this.#state });
    return () => this.#listeners.delete(listener);
  }

  /** Reference/test-only control for denied/error unlock scenarios. */
  setUnlockResult(result: SessionUnlockResult): void {
    this.#unlockResult = result;
  }

  #emit(): void {
    for (const listener of this.#listeners) listener({ ...this.#state });
  }
}
