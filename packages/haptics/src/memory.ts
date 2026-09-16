import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { HapticIntent, ExpoBaseHaptics } from './contracts';
export class MemoryHaptics implements ExpoBaseHaptics {
  readonly intents: HapticIntent[] = [];
  available = true;
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async perform(intent: HapticIntent): Promise<ExpoBaseCapabilityResult<undefined>> { const availability = await this.availability(); if (availability.status !== 'available') return availability; this.intents.push(intent); return { status: 'success', value: undefined }; }
}
