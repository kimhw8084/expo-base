import { MemoryPermissionAdapter } from '@expo-base/capabilities';
import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseAcquiredResource, ExpoBaseDocumentPicker, ExpoBaseDocumentPickOptions, ExpoBaseMediaAcquisition, ExpoBaseMediaPickOptions } from './contracts';

export class MemoryDocumentPicker implements ExpoBaseDocumentPicker {
  resources: readonly ExpoBaseAcquiredResource[] = [];
  available = true;
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async pick(_options?: ExpoBaseDocumentPickOptions): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> {
    const availability = await this.availability();
    return availability.status === 'available' ? { status: 'success', value: this.resources.map((resource) => ({ ...resource })) } : availability;
  }
}

export class MemoryMediaAcquisition implements ExpoBaseMediaAcquisition {
  libraryPermission = new MemoryPermissionAdapter();
  cameraPermission = new MemoryPermissionAdapter();
  libraryResources: readonly ExpoBaseAcquiredResource[] = [];
  cameraResources: readonly ExpoBaseAcquiredResource[] = [];
  available = true;
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async pickFromLibrary(_options?: ExpoBaseMediaPickOptions): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> { return this.#result(this.libraryResources); }
  async captureWithCamera(_options?: Omit<ExpoBaseMediaPickOptions, 'multiple'>): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> { return this.#result(this.cameraResources); }
  async #result(resources: readonly ExpoBaseAcquiredResource[]): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> {
    const availability = await this.availability();
    return availability.status === 'available' ? { status: 'success', value: resources.map((resource) => ({ ...resource })) } : availability;
  }
}
