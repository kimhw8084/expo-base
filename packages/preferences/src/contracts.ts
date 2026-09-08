import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
export const precisionPreferencesCapability = 'preferences';
/** Device-local, non-secret preferences only. Server-synced product settings stay product-owned. */
export interface PrecisionPreferences {
  availability(): Promise<PrecisionCapabilityAvailability>;
  get(key: string): Promise<PrecisionCapabilityResult<string | null>>;
  set(key: string, value: string): Promise<PrecisionCapabilityResult<undefined>>;
  remove(key: string): Promise<PrecisionCapabilityResult<undefined>>;
}
export interface PrecisionPreferencesOptions { namespace: string; version?: number | undefined; }
