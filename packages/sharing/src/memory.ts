import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseClipboard, ExpoBaseShareRequest, ExpoBaseSharing } from './contracts';

export class MemoryClipboard implements ExpoBaseClipboard {
  #value = '';
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  async copyText(value: string): Promise<ExpoBaseCapabilityResult<undefined>> { this.#value = value; return { status: 'success', value: undefined }; }
  async readText(): Promise<ExpoBaseCapabilityResult<string>> { return { status: 'success', value: this.#value }; }
}

export class MemorySharing implements ExpoBaseSharing {
  readonly requests: ExpoBaseShareRequest[] = [];
  available = true;
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return this.available ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
  async share(request: ExpoBaseShareRequest): Promise<ExpoBaseCapabilityResult<undefined>> {
    if (!this.available) return { status: 'unavailable', reason: 'unsupported' };
    this.requests.push({ ...request });
    return { status: 'success', value: undefined };
  }
}
