import type { AuthResolutionStatus, ProtectedAccessState } from './contracts';

/**
 * Navigation authorization is derived from explicit auth resolution and local
 * session lock state. A local lock can only restrict a known signed-in session;
 * it can never promote a signed-out/error/loading state.
 */
export function deriveProtectedAccess(
  authStatus: AuthResolutionStatus,
  options: { locallyLocked?: boolean } = {},
): ProtectedAccessState {
  if (authStatus === 'loading') return 'booting';
  if (authStatus === 'error') return 'error';
  if (authStatus === 'signed-out') return 'signed-out';
  return options.locallyLocked ? 'locked' : 'granted';
}

export function canRenderProtectedContent(access: ProtectedAccessState): boolean {
  return access === 'granted';
}

/** A fetch may commit only if no subscription event arrived after it started. */
export function isSessionFetchCurrent(revisionAtStart: number, currentRevision: number): boolean {
  return Number.isSafeInteger(revisionAtStart) && Number.isSafeInteger(currentRevision) && revisionAtStart >= 0 && revisionAtStart === currentRevision;
}
