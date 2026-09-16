import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseUpdateCheck, ExpoBaseUpdates } from './contracts';

export class MemoryUpdates implements ExpoBaseUpdates {
  available = true;
  checkResult: ExpoBaseUpdateCheck = { status: 'up-to-date' };
  downloaded = false;
  reloaded = false;
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'configuration-missing' }; }
  async check(): Promise<ExpoBaseUpdateCheck> { const availability = await this.availability(); return availability.status === 'available' ? { ...this.checkResult } : availability; }
  async download(): Promise<ExpoBaseCapabilityResult<{ downloaded: boolean }>> { const availability = await this.availability(); if (availability.status !== 'available') return availability; this.downloaded = this.checkResult.status === 'available'; return { status: 'success', value: { downloaded: this.downloaded } }; }
  async reload(): Promise<ExpoBaseCapabilityResult<undefined>> { const availability = await this.availability(); if (availability.status !== 'available') return availability; this.reloaded = true; return { status: 'success', value: undefined }; }
}
