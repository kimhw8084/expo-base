export type SessionLockReason = 'manual' | 'background' | 'inactivity' | 'security-policy';

export type SessionSecurityStatus = 'loading' | 'ready' | 'error';

export type SessionUnlockResult = 'unlocked' | 'denied' | 'error';

export interface SessionSecurityState {
  locked: boolean;
  reason: SessionLockReason | null;
}

export type SessionSecurityListener = (state: SessionSecurityState) => void;

/**
 * Device-specific session locking lives behind this adapter. Implementations may
 * use biometrics, secure storage, AppState/lifecycle signals, or enterprise
 * policy without leaking those dependencies into product screens.
 */
export interface SessionSecurityAdapter {
  getState(): Promise<SessionSecurityState>;
  lock(reason?: SessionLockReason): Promise<void>;
  requestUnlock(): Promise<SessionUnlockResult>;
  subscribe(listener: SessionSecurityListener): () => void;
}
