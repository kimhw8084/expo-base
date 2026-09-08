import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';

export const precisionSecureStorageCapability = 'secureStorage';

export interface PrecisionSecureStorage {
  availability(): Promise<PrecisionCapabilityAvailability>;
  get(key: string): Promise<PrecisionCapabilityResult<string | null>>;
  set(key: string, value: string): Promise<PrecisionCapabilityResult<undefined>>;
  remove(key: string): Promise<PrecisionCapabilityResult<undefined>>;
}

export interface PrecisionSecureStorageOptions {
  namespace: string;
  version?: number | undefined;
}
