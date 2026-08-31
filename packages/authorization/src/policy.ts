import type { AuthorizationDecision, AuthorizationSnapshot, CapabilityRequirement } from './contracts';

const CAPABILITY_KEY = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)*$/;
const MAX_REQUIREMENT_KEYS = 64;

export function isValidCapabilityKey(value: string): boolean {
  return value.length > 0 && value.length <= 128 && CAPABILITY_KEY.test(value);
}

export function normalizeCapabilities(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(isValidCapabilityKey))].sort();
}

export function validateCapabilityRequirement(requirement: CapabilityRequirement): boolean {
  const all = [...(requirement.all ?? []), ...(requirement.any ?? []), ...(requirement.none ?? [])];
  return all.length <= MAX_REQUIREMENT_KEYS && all.every(isValidCapabilityKey);
}

/**
 * Client authorization is fail-closed: loading/error/inactive states never
 * grant a protected capability. Backend APIs must still enforce authorization.
 */
export function evaluateCapabilityRequirement(
  snapshot: AuthorizationSnapshot,
  requirement: CapabilityRequirement,
): AuthorizationDecision {
  if (!validateCapabilityRequirement(requirement)) return { allowed: false, reason: 'invalid_requirement' };
  if (snapshot.status === 'inactive') return { allowed: false, reason: 'inactive' };
  if (snapshot.status === 'loading') return { allowed: false, reason: 'loading' };
  if (snapshot.status === 'error') return { allowed: false, reason: 'error' };

  const available = new Set(normalizeCapabilities(snapshot.capabilities));
  const all = [...new Set(requirement.all ?? [])];
  const any = [...new Set(requirement.any ?? [])];
  const none = [...new Set(requirement.none ?? [])];
  const missingAll = all.filter((key) => !available.has(key));
  if (missingAll.length) return { allowed: false, reason: 'missing_all', missing: missingAll };
  if (any.length && !any.some((key) => available.has(key))) return { allowed: false, reason: 'missing_any', missing: any };
  const denied = none.filter((key) => available.has(key));
  if (denied.length) return { allowed: false, reason: 'denied_capability', denied };
  return { allowed: true, reason: 'granted' };
}

/** A capability fetch may commit only if no live policy update arrived after it started. */
export function isCapabilityFetchCurrent(revisionAtStart: number, currentRevision: number): boolean {
  return Number.isSafeInteger(revisionAtStart) && Number.isSafeInteger(currentRevision) && revisionAtStart >= 0 && revisionAtStart === currentRevision;
}
