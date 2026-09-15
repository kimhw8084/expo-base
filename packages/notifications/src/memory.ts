import { MemoryPermissionAdapter } from '@expo-base/capabilities';
import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseNotificationOpenEvent, ExpoBaseNotifications } from './contracts';

export class MemoryNotifications implements ExpoBaseNotifications {
  permission = new MemoryPermissionAdapter();
  token: string | null = null;
  available = true;
  #listeners = new Set<(event: ExpoBaseNotificationOpenEvent) => void>();
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async getToken(): Promise<ExpoBaseCapabilityResult<string>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    return this.token ? { status: 'success', value: this.token } : { status: 'unavailable', reason: 'configuration-missing' };
  }
  subscribeOpen(listener: (event: ExpoBaseNotificationOpenEvent) => void): () => void { this.#listeners.add(listener); return () => this.#listeners.delete(listener); }
  emitOpen(event: ExpoBaseNotificationOpenEvent): void { for (const listener of this.#listeners) listener({ identifier: event.identifier, data: { ...event.data } }); }
}
