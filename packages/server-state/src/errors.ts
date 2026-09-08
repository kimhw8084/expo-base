export type PrecisionServerErrorKind =
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

export interface PrecisionServerErrorOptions {
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
export class PrecisionServerError extends Error {
  readonly kind: PrecisionServerErrorKind;
  readonly code: string | undefined;
  readonly retryable: boolean;

  constructor(kind: PrecisionServerErrorKind, message = 'The request could not be completed.', options: PrecisionServerErrorOptions = {}) {
    super(message);
    this.name = 'PrecisionServerError';
    this.kind = kind;
    this.code = options.code;
    this.retryable = options.retryable ?? defaultRetryable(kind);
  }
}

export function normalizePrecisionServerError(error: unknown): PrecisionServerError {
  if (error instanceof PrecisionServerError) return error;
  if (isAbortError(error)) return new PrecisionServerError('cancelled', 'The request was cancelled.', { retryable: false });
  return new PrecisionServerError('unknown', 'The request could not be completed.', { retryable: false });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function defaultRetryable(kind: PrecisionServerErrorKind): boolean {
  return kind === 'rate-limited' || kind === 'unavailable' || kind === 'timeout';
}
