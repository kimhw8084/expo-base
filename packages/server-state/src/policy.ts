import { normalizePrecisionServerError, type PrecisionServerError } from './errors';

export interface PrecisionRetryPolicy {
  /** Number of retries after the initial attempt. */
  retries: number;
  shouldRetry?: ((error: PrecisionServerError, failureCount: number) => boolean) | undefined;
  delayMs?: ((failureCount: number, error: PrecisionServerError) => number) | undefined;
}

export interface PrecisionServerStateConfig {
  staleTimeMs?: number | undefined;
  cacheRetentionMs?: number | undefined;
  queryRetry?: PrecisionRetryPolicy | false | undefined;
}

export const precisionServerStateDefaults = Object.freeze({
  staleTimeMs: 30_000,
  cacheRetentionMs: 5 * 60_000,
  queryRetries: 2,
});

export function shouldRetryPrecisionQuery(failureCount: number, error: unknown, policy: PrecisionRetryPolicy | false = {
  retries: precisionServerStateDefaults.queryRetries,
}): boolean {
  if (policy === false || failureCount >= normalizeRetryCount(policy.retries)) return false;
  const normalized = normalizePrecisionServerError(error);
  if (!normalized.retryable || normalized.kind === 'unauthorized' || normalized.kind === 'forbidden' || normalized.kind === 'validation' || normalized.kind === 'not-found' || normalized.kind === 'conflict' || normalized.kind === 'cancelled') return false;
  return policy.shouldRetry?.(normalized, failureCount) ?? true;
}

export function precisionRetryDelayMs(failureCount: number, error: unknown, policy?: PrecisionRetryPolicy | false): number {
  if (policy && policy.delayMs) return normalizeDelay(policy.delayMs(failureCount, normalizePrecisionServerError(error)));
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
