import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseDevice, ExpoBaseDeviceInfo } from './contracts';
export class MemoryDevice implements ExpoBaseDevice {
  info: ExpoBaseDeviceInfo = { platform: 'web', deviceClass: 'desktop', appVersion: null, buildVersion: null, isPhysicalDevice: null };
  available = true;
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async getInfo(): Promise<ExpoBaseCapabilityResult<ExpoBaseDeviceInfo>> { const availability = await this.availability(); return availability.status === 'available' ? { status: 'success', value: { ...this.info } } : availability; }
}
