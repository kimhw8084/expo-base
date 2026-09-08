import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionDevice, PrecisionDeviceInfo } from './contracts';
export class MemoryDevice implements PrecisionDevice {
  info: PrecisionDeviceInfo = { platform: 'web', deviceClass: 'desktop', appVersion: null, buildVersion: null, isPhysicalDevice: null };
  available = true;
  async availability(): Promise<PrecisionCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async getInfo(): Promise<PrecisionCapabilityResult<PrecisionDeviceInfo>> { const availability = await this.availability(); return availability.status === 'available' ? { status: 'success', value: { ...this.info } } : availability; }
}
