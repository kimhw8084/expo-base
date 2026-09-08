import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionSecureStorage } from './contracts';

/** Test-only memory storage. It deliberately makes no security claim. */
export class MemorySecureStorage implements PrecisionSecureStorage {
  #values = new Map<string, string>();
  #available: PrecisionCapabilityAvailability = { status: 'available' };
  async availability(): Promise<PrecisionCapabilityAvailability> { return { ...this.#available }; }
  async get(key: string): Promise<PrecisionCapabilityResult<string | null>> { return this.#available.status === 'available' ? { status: 'success', value: this.#values.get(key) ?? null } : this.#available; }
  async set(key: string, value: string): Promise<PrecisionCapabilityResult<undefined>> { if (this.#available.status !== 'available') return this.#available; this.#values.set(key, value); return { status: 'success', value: undefined }; }
  async remove(key: string): Promise<PrecisionCapabilityResult<undefined>> { if (this.#available.status !== 'available') return this.#available; this.#values.delete(key); return { status: 'success', value: undefined }; }
  setAvailability(value: PrecisionCapabilityAvailability): void { this.#available = value; }
}
