import { normalizeExpoBaseServerError, type ExpoBaseServerError } from './errors';

export interface ExpoBaseRetryPolicy {
  /** Number of retries after the initial attempt. */
  retries: number;
  shouldRetry?: ((error: ExpoBaseServerError, failureCount: number) => boolean) | undefined;
  delayMs?: ((failureCount: number, error: ExpoBaseServerError) => number) | undefined;
}

export interface ExpoBaseServerStateConfig {
  staleTimeMs?: number | undefined;
  cacheRetentionMs?: number | undefined;
  queryRetry?: ExpoBaseRetryPolicy | false | undefined;
}

export const expoBaseServerStateDefaults = Object.freeze({
  staleTimeMs: 30_000,
  cacheRetentionMs: 5 * 60_000,
  queryRetries: 2,
});

export function shouldRetryExpoBaseQuery(failureCount: number, error: unknown, policy: ExpoBaseRetryPolicy | false = {
  retries: expoBaseServerStateDefaults.queryRetries,
}): boolean {
  if (policy === false || failureCount >= normalizeRetryCount(policy.retries)) return false;
  const normalized = normalizeExpoBaseServerError(error);
  if (!normalized.retryable || normalized.kind === 'unauthorized' || normalized.kind === 'forbidden' || normalized.kind === 'validation' || normalized.kind === 'not-found' || normalized.kind === 'conflict' || normalized.kind === 'cancelled') return false;
  return policy.shouldRetry?.(normalized, failureCount) ?? true;
}

export function expoBaseRetryDelayMs(failureCount: number, error: unknown, policy?: ExpoBaseRetryPolicy | false): number {
  if (policy && policy.delayMs) return normalizeDelay(policy.delayMs(failureCount, normalizeExpoBaseServerError(error)));
  return Math.min(250 * (2 ** Math.max(0, failureCount)), 2_000);
}

export function normalizeRetryCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.trunc(value)));
}

function normalizeDelay(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(30_000, Math.trunc(value)));
}
