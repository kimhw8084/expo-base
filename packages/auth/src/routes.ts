import type { ProtectedAccessState } from './contracts';

export interface ProtectedRouteSets {
  always?: readonly string[];
  authenticated: readonly string[];
  signedOut: readonly string[];
  booting: readonly string[];
  error: readonly string[];
  locked?: readonly string[];
}

export interface RouteSetValidation {
  valid: boolean;
  duplicates: readonly string[];
  missingForAccess: readonly ProtectedAccessState[];
}

/** Detects duplicate screen declarations before Expo Router sees them. */
export function validateProtectedRouteSets(sets: ProtectedRouteSets): RouteSetValidation {
  const groups: readonly [ProtectedAccessState | 'always', readonly string[]][] = [
    ['always', sets.always ?? []],
    ['granted', sets.authenticated],
    ['signed-out', sets.signedOut],
    ['booting', sets.booting],
    ['error', sets.error],
    ['locked', sets.locked ?? []],
  ];
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const [group, screens] of groups) {
    for (const screen of screens) {
      const previous = seen.get(screen);
      if (previous && previous !== group) duplicates.add(screen);
      else seen.set(screen, group);
    }
  }
  const missingForAccess: ProtectedAccessState[] = [];
  if (!sets.authenticated.length) missingForAccess.push('granted');
  if (!sets.signedOut.length) missingForAccess.push('signed-out');
  if (!sets.booting.length) missingForAccess.push('booting');
  if (!sets.error.length) missingForAccess.push('error');
  if (sets.locked && !sets.locked.length) missingForAccess.push('locked');
  return { valid: duplicates.size === 0 && missingForAccess.length === 0, duplicates: [...duplicates].sort(), missingForAccess };
}
