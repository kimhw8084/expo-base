export type AuthorizationStatus = 'inactive' | 'loading' | 'ready' | 'error';

export interface CapabilityRequirement {
  /** Every capability listed here must be present. */
  all?: readonly string[];
  /** At least one capability listed here must be present. */
  any?: readonly string[];
  /** None of these capabilities may be present. */
  none?: readonly string[];
}

export type AuthorizationDecisionReason =
  | 'granted'
  | 'inactive'
  | 'loading'
  | 'error'
  | 'missing_all'
  | 'missing_any'
  | 'denied_capability'
  | 'invalid_requirement';

export interface AuthorizationDecision {
  allowed: boolean;
  reason: AuthorizationDecisionReason;
  missing?: readonly string[];
  denied?: readonly string[];
}

export interface AuthorizationSnapshot {
  status: AuthorizationStatus;
  capabilities: readonly string[];
}
