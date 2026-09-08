import { MemoryPermissionAdapter } from '@precision-calm/capabilities';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionAcquiredResource, PrecisionDocumentPicker, PrecisionDocumentPickOptions, PrecisionMediaAcquisition, PrecisionMediaPickOptions } from './contracts';

export class MemoryDocumentPicker implements PrecisionDocumentPicker {
  resources: readonly PrecisionAcquiredResource[] = [];
  available = true;
  async availability(): Promise<PrecisionCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async pick(_options?: PrecisionDocumentPickOptions): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> {
    const availability = await this.availability();
    return availability.status === 'available' ? { status: 'success', value: this.resources.map((resource) => ({ ...resource })) } : availability;
  }
}

export class MemoryMediaAcquisition implements PrecisionMediaAcquisition {
  libraryPermission = new MemoryPermissionAdapter();
  cameraPermission = new MemoryPermissionAdapter();
  libraryResources: readonly PrecisionAcquiredResource[] = [];
  cameraResources: readonly PrecisionAcquiredResource[] = [];
  available = true;
  async availability(): Promise<PrecisionCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async pickFromLibrary(_options?: PrecisionMediaPickOptions): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> { return this.#result(this.libraryResources); }
  async captureWithCamera(_options?: Omit<PrecisionMediaPickOptions, 'multiple'>): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> { return this.#result(this.cameraResources); }
  async #result(resources: readonly PrecisionAcquiredResource[]): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> {
    const availability = await this.availability();
    return availability.status === 'available' ? { status: 'success', value: resources.map((resource) => ({ ...resource })) } : availability;
  }
}
