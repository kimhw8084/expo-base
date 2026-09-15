import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBasePreferences } from './contracts';
export class MemoryPreferences implements ExpoBasePreferences {
  #values = new Map<string, string>();
  #availability: ExpoBaseCapabilityAvailability = { status: 'available' };
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { ...this.#availability }; }
  async get(key: string): Promise<ExpoBaseCapabilityResult<string | null>> { return this.#availability.status === 'available' ? { status: 'success', value: this.#values.get(key) ?? null } : this.#availability; }
  async set(key: string, value: string): Promise<ExpoBaseCapabilityResult<undefined>> { if (this.#availability.status !== 'available') return this.#availability; this.#values.set(key, value); return { status: 'success', value: undefined }; }
  async remove(key: string): Promise<ExpoBaseCapabilityResult<undefined>> { if (this.#availability.status !== 'available') return this.#availability; this.#values.delete(key); return { status: 'success', value: undefined }; }
  setAvailability(value: ExpoBaseCapabilityAvailability): void { this.#availability = value; }
}
