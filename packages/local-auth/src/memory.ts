import type { ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseLocalAuthentication, ExpoBaseLocalAuthenticationAvailability, ExpoBaseLocalAuthenticationRequest } from './contracts';

/** Deterministic reference/test implementation; it provides no security. */
export class MemoryLocalAuthentication implements ExpoBaseLocalAuthentication {
  #availability: ExpoBaseLocalAuthenticationAvailability;
  #result: ExpoBaseCapabilityResult<undefined> = { status: 'success', value: undefined };
  requests: ExpoBaseLocalAuthenticationRequest[] = [];
  constructor(availability: ExpoBaseLocalAuthenticationAvailability = { status: 'available', enrolled: true }) { this.#availability = availability; }
  async availability(): Promise<ExpoBaseLocalAuthenticationAvailability> { return { ...this.#availability }; }
  async authenticate(request: ExpoBaseLocalAuthenticationRequest): Promise<ExpoBaseCapabilityResult<undefined>> {
    this.requests.push({ ...request });
    return { ...this.#result } as ExpoBaseCapabilityResult<undefined>;
  }
  setAvailability(value: ExpoBaseLocalAuthenticationAvailability): void { this.#availability = value; }
  setResult(value: ExpoBaseCapabilityResult<undefined>): void { this.#result = value; }
}
