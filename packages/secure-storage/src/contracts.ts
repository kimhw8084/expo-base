import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';

export const expoBaseSecureStorageCapability = 'secureStorage';

export interface ExpoBaseSecureStorage {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  get(key: string): Promise<ExpoBaseCapabilityResult<string | null>>;
  set(key: string, value: string): Promise<ExpoBaseCapabilityResult<undefined>>;
  remove(key: string): Promise<ExpoBaseCapabilityResult<undefined>>;
}

export interface ExpoBaseSecureStorageOptions {
  namespace: string;
  version?: number | undefined;
}
