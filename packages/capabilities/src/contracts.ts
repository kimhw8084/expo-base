/** Shared result vocabulary; detailed capability outcomes stay in their own packages. */
export type PrecisionCapabilityAvailability =
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'unsupported' | 'configuration-missing' | 'temporarily-unavailable' };

export type PrecisionCapabilityFailure =
  | { status: 'unavailable'; reason: 'unsupported' | 'configuration-missing' | 'temporarily-unavailable' }
  | { status: 'denied'; canOpenSettings: boolean }
  | { status: 'restricted' }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

export type PrecisionCapabilityResult<T> = { status: 'success'; value: T } | PrecisionCapabilityFailure;

export type PrecisionPermissionStatus = 'granted' | 'denied' | 'restricted' | 'undetermined' | 'unavailable';

export interface PrecisionPermissionSnapshot {
  status: PrecisionPermissionStatus;
  canAskAgain: boolean;
  canOpenSettings: boolean;
}

export interface PrecisionPermissionAdapter {
  get(): Promise<PrecisionPermissionSnapshot>;
  request(): Promise<PrecisionPermissionSnapshot>;
  openSettings(): Promise<PrecisionCapabilityResult<undefined>>;
}

export interface PrecisionCapabilityRegistry {
  readonly [key: string]: unknown;
}

/** Keeps root capability composition explicit and type-checked without coupling the kernel to native packages. */
export function createPrecisionCapabilityRegistry<T extends PrecisionCapabilityRegistry>(capabilities: T): T {
  return Object.freeze({ ...capabilities }) as T;
}
