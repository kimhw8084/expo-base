import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseSecureStorage } from './contracts';

/** Test-only memory storage. It deliberately makes no security claim. */
export class MemorySecureStorage implements ExpoBaseSecureStorage {
  #values = new Map<string, string>();
  #available: ExpoBaseCapabilityAvailability = { status: 'available' };
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { ...this.#available }; }
  async get(key: string): Promise<ExpoBaseCapabilityResult<string | null>> { return this.#available.status === 'available' ? { status: 'success', value: this.#values.get(key) ?? null } : this.#available; }
  async set(key: string, value: string): Promise<ExpoBaseCapabilityResult<undefined>> { if (this.#available.status !== 'available') return this.#available; this.#values.set(key, value); return { status: 'success', value: undefined }; }
  async remove(key: string): Promise<ExpoBaseCapabilityResult<undefined>> { if (this.#available.status !== 'available') return this.#available; this.#values.delete(key); return { status: 'success', value: undefined }; }
  setAvailability(value: ExpoBaseCapabilityAvailability): void { this.#available = value; }
}
