import { MemoryPermissionAdapter } from '@precision-calm/capabilities';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionNotificationOpenEvent, PrecisionNotifications } from './contracts';

export class MemoryNotifications implements PrecisionNotifications {
  permission = new MemoryPermissionAdapter();
  token: string | null = null;
  available = true;
  #listeners = new Set<(event: PrecisionNotificationOpenEvent) => void>();
  async availability(): Promise<PrecisionCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async getToken(): Promise<PrecisionCapabilityResult<string>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    return this.token ? { status: 'success', value: this.token } : { status: 'unavailable', reason: 'configuration-missing' };
  }
  subscribeOpen(listener: (event: PrecisionNotificationOpenEvent) => void): () => void { this.#listeners.add(listener); return () => this.#listeners.delete(listener); }
  emitOpen(event: PrecisionNotificationOpenEvent): void { for (const listener of this.#listeners) listener({ identifier: event.identifier, data: { ...event.data } }); }
}
