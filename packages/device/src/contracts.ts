import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';

export const precisionDeviceCapability = 'device';
export type PrecisionDevicePlatform = 'ios' | 'android' | 'web' | 'unknown';
export type PrecisionDeviceClass = 'phone' | 'tablet' | 'desktop' | 'unknown';

/** Privacy-safe, read-only application/device facts. No identifier or fingerprinting surface is exposed. */
export interface PrecisionDeviceInfo {
  platform: PrecisionDevicePlatform;
  deviceClass: PrecisionDeviceClass;
  appVersion: string | null;
  buildVersion: string | null;
  isPhysicalDevice: boolean | null;
}

export interface PrecisionDevice {
  availability(): Promise<PrecisionCapabilityAvailability>;
  getInfo(): Promise<PrecisionCapabilityResult<PrecisionDeviceInfo>>;
}
