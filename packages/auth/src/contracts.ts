export type AuthResolutionStatus = 'loading' | 'signed-out' | 'signed-in' | 'error';

export type ProtectedAccessState = 'booting' | 'signed-out' | 'locked' | 'granted' | 'error';

export type AuthActionStatus = 'idle' | 'signing-in' | 'signing-out' | 'refreshing';

export type SafeAuthErrorCode =
  | 'session_unavailable'
  | 'sign_in_failed'
  | 'sign_out_failed'
  | 'refresh_failed';

export interface ReturnIntentPolicy {
  /** Internal route maximum; deliberately lower than the external-link limit. */
  maxLength?: number;
  /** Exact public paths that must never become a post-auth destination. */
  excludedPaths?: readonly string[];
  /** Path prefixes such as /sign-in or /auth that must never become return destinations. */
  excludedPrefixes?: readonly string[];
}

export type ReturnIntentDecision =
  | { allowed: true; path: `/${string}` }
  | { allowed: false; reason: 'empty' | 'too_long' | 'external' | 'malformed' | 'excluded' };

export interface ReturnIntentChannel {
  capture(path: string): boolean;
  peek(): `/${string}` | null;
  consume(fallback?: `/${string}`): `/${string}`;
  clear(): void;
  subscribe(listener: (path: `/${string}` | null) => void): () => void;
}
