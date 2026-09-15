export type ExpoBaseServerErrorKind =
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'rate-limited'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export interface ExpoBaseServerErrorOptions {
  /** Stable product-owned code; never a backend response body. */
  code?: string | undefined;
  /** Explicit retry decision supplied by the service adapter. */
  retryable?: boolean | undefined;
}

/**
 * A small presentation-safe error boundary for service adapters. Backend
 * payloads stay in the adapter; routes receive only a stable kind/code and an
 * explicitly safe message.
 */
export class ExpoBaseServerError extends Error {
  readonly kind: ExpoBaseServerErrorKind;
  readonly code: string | undefined;
  readonly retryable: boolean;

  constructor(kind: ExpoBaseServerErrorKind, message = 'The request could not be completed.', options: ExpoBaseServerErrorOptions = {}) {
    super(message);
    this.name = 'ExpoBaseServerError';
    this.kind = kind;
    this.code = options.code;
    this.retryable = options.retryable ?? defaultRetryable(kind);
  }
}

export function normalizeExpoBaseServerError(error: unknown): ExpoBaseServerError {
  if (error instanceof ExpoBaseServerError) return error;
  if (isAbortError(error)) return new ExpoBaseServerError('cancelled', 'The request was cancelled.', { retryable: false });
  return new ExpoBaseServerError('unknown', 'The request could not be completed.', { retryable: false });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function defaultRetryable(kind: ExpoBaseServerErrorKind): boolean {
  return kind === 'rate-limited' || kind === 'unavailable' || kind === 'timeout';
}
