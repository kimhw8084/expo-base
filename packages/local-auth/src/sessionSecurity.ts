import type { SessionLockReason, SessionSecurityAdapter, SessionSecurityListener, SessionSecurityState, SessionUnlockResult } from '@precision-calm/session-security';
import type { PrecisionLocalAuthentication } from './contracts';

/** Root-composed bridge: local authentication unlocks a local session only. */
export class LocalAuthenticationSessionSecurityAdapter implements SessionSecurityAdapter {
  readonly #authentication: PrecisionLocalAuthentication;
  readonly #request: { prompt: string; requireBiometrics?: boolean | undefined };
  #state: SessionSecurityState;
  #listeners = new Set<SessionSecurityListener>();

  constructor(authentication: PrecisionLocalAuthentication, options: { initiallyLocked?: boolean | undefined; prompt?: string | undefined; requireBiometrics?: boolean | undefined } = {}) {
    this.#authentication = authentication;
    this.#request = { prompt: options.prompt ?? 'Unlock secure session', ...(options.requireBiometrics === undefined ? {} : { requireBiometrics: options.requireBiometrics }) };
    this.#state = { locked: options.initiallyLocked ?? false, reason: options.initiallyLocked ? 'security-policy' : null };
  }
  async getState(): Promise<SessionSecurityState> { return { ...this.#state }; }
  async lock(reason: SessionLockReason = 'manual'): Promise<void> { this.#state = { locked: true, reason }; this.#emit(); }
  async requestUnlock(): Promise<SessionUnlockResult> {
    const result = await this.#authentication.authenticate(this.#request);
    if (result.status === 'success') { this.#state = { locked: false, reason: null }; this.#emit(); return 'unlocked'; }
    return result.status === 'denied' || result.status === 'cancelled' ? 'denied' : 'error';
  }
  subscribe(listener: SessionSecurityListener): () => void { this.#listeners.add(listener); listener({ ...this.#state }); return () => this.#listeners.delete(listener); }
  #emit(): void { for (const listener of this.#listeners) listener({ ...this.#state }); }
}
