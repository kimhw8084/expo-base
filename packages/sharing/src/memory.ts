import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionClipboard, PrecisionShareRequest, PrecisionSharing } from './contracts';

export class MemoryClipboard implements PrecisionClipboard {
  #value = '';
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async copyText(value: string): Promise<PrecisionCapabilityResult<undefined>> { this.#value = value; return { status: 'success', value: undefined }; }
  async readText(): Promise<PrecisionCapabilityResult<string>> { return { status: 'success', value: this.#value }; }
}

export class MemorySharing implements PrecisionSharing {
  readonly requests: PrecisionShareRequest[] = [];
  available = true;
  async availability(): Promise<PrecisionCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async share(request: PrecisionShareRequest): Promise<PrecisionCapabilityResult<undefined>> {
    if (!this.available) return { status: 'unavailable', reason: 'unsupported' };
    this.requests.push({ ...request });
    return { status: 'success', value: undefined };
  }
}
