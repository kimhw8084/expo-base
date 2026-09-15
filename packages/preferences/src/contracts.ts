import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
export const expoBasePreferencesCapability = 'preferences';
/** Device-local, non-secret preferences only. Server-synced product settings stay product-owned. */
export interface ExpoBasePreferences {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  get(key: string): Promise<ExpoBaseCapabilityResult<string | null>>;
  set(key: string, value: string): Promise<ExpoBaseCapabilityResult<undefined>>;
  remove(key: string): Promise<ExpoBaseCapabilityResult<undefined>>;
}
export interface ExpoBasePreferencesOptions { namespace: string; version?: number | undefined; }
