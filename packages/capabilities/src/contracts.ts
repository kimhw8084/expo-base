/** Shared result vocabulary; detailed capability outcomes stay in their own packages. */
export type ExpoBaseCapabilityAvailability =
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'unsupported' | 'configuration-missing' | 'temporarily-unavailable' };

export type ExpoBaseCapabilityFailure =
  | { status: 'unavailable'; reason: 'unsupported' | 'configuration-missing' | 'temporarily-unavailable' }
  | { status: 'denied'; canOpenSettings: boolean }
  | { status: 'restricted' }
  | { status: 'cancelled' }
  | { status: 'error'; code: string };

export type ExpoBaseCapabilityResult<T> = { status: 'success'; value: T } | ExpoBaseCapabilityFailure;

export type ExpoBasePermissionStatus = 'granted' | 'denied' | 'restricted' | 'undetermined' | 'unavailable';

export interface ExpoBasePermissionSnapshot {
  status: ExpoBasePermissionStatus;
  canAskAgain: boolean;
  canOpenSettings: boolean;
}

export interface ExpoBasePermissionAdapter {
  get(): Promise<ExpoBasePermissionSnapshot>;
  request(): Promise<ExpoBasePermissionSnapshot>;
  openSettings(): Promise<ExpoBaseCapabilityResult<undefined>>;
}

export interface ExpoBaseCapabilityRegistry {
  readonly [key: string]: unknown;
}

/** Keeps root capability composition explicit and type-checked without coupling the kernel to native packages. */
export function createExpoBaseCapabilityRegistry<T extends ExpoBaseCapabilityRegistry>(capabilities: T): T {
  return Object.freeze({ ...capabilities }) as T;
}
