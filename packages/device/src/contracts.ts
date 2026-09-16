import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';

export const expoBaseDeviceCapability = 'device';
export type ExpoBaseDevicePlatform = 'ios' | 'android' | 'web' | 'unknown';
export type ExpoBaseDeviceClass = 'phone' | 'tablet' | 'desktop' | 'unknown';

/** Privacy-safe, read-only application/device facts. No identifier or fingerprinting surface is exposed. */
export interface ExpoBaseDeviceInfo {
  platform: ExpoBaseDevicePlatform;
  deviceClass: ExpoBaseDeviceClass;
  appVersion: string | null;
  buildVersion: string | null;
  isPhysicalDevice: boolean | null;
}

export interface ExpoBaseDevice {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  getInfo(): Promise<ExpoBaseCapabilityResult<ExpoBaseDeviceInfo>>;
}
