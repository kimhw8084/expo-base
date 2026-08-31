import type { ReturnIntentChannel, ReturnIntentDecision, ReturnIntentPolicy } from './contracts';

const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;
const DEFAULT_MAX_LENGTH = 2048;

/**
 * Accepts only same-app absolute paths. It intentionally strips fragments so
 * OAuth tokens or other fragment data cannot become persisted return intent.
 */
export function validateReturnIntent(input: string, policy: ReturnIntentPolicy = {}): ReturnIntentDecision {
  const value = input.trim();
  if (!value) return { allowed: false, reason: 'empty' };
  if (value.length > (policy.maxLength ?? DEFAULT_MAX_LENGTH)) return { allowed: false, reason: 'too_long' };
  if (!value.startsWith('/') || value.startsWith('//')) return { allowed: false, reason: 'external' };
  if (CONTROL_CHARACTERS.test(value) || value.includes('\\')) return { allowed: false, reason: 'malformed' };

  let parsed: URL;
  try { parsed = new URL(value, 'https://precision.invalid'); }
  catch { return { allowed: false, reason: 'malformed' }; }
  if (parsed.origin !== 'https://precision.invalid') return { allowed: false, reason: 'external' };

  const normalized = `${parsed.pathname}${parsed.search}` as `/${string}`;
  const excludedPaths = new Set(policy.excludedPaths ?? []);
  if (excludedPaths.has(parsed.pathname)) return { allowed: false, reason: 'excluded' };
  if ((policy.excludedPrefixes ?? []).some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) {
    return { allowed: false, reason: 'excluded' };
  }
  return { allowed: true, path: normalized };
}

export function choosePostAuthDestination(
  pending: string | null | undefined,
  fallback: `/${string}`,
  policy: ReturnIntentPolicy = {},
): `/${string}` {
  if (!pending) return fallback;
  const decision = validateReturnIntent(pending, policy);
  return decision.allowed ? decision.path : fallback;
}


/**
 * Small in-memory bridge that can be shared by native-intent processing and
 * the auth runtime. It never persists destinations to disk.
 */
export function createReturnIntentChannel(policy: ReturnIntentPolicy = {}): ReturnIntentChannel {
  let pending: `/${string}` | null = null;
  const listeners = new Set<(path: `/${string}` | null) => void>();
  const emit = () => { for (const listener of listeners) listener(pending); };
  return {
    capture(path) {
      const decision = validateReturnIntent(path, policy);
      if (!decision.allowed) return false;
      if (pending !== decision.path) { pending = decision.path; emit(); }
      return true;
    },
    peek() { return pending; },
    consume(fallback = '/') {
      const destination = choosePostAuthDestination(pending, fallback, policy);
      if (pending !== null) { pending = null; emit(); }
      return destination;
    },
    clear() { if (pending !== null) { pending = null; emit(); } },
    subscribe(listener) { listeners.add(listener); listener(pending); return () => listeners.delete(listener); },
  };
}
