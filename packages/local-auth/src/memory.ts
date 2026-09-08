import type { PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionLocalAuthentication, PrecisionLocalAuthenticationAvailability, PrecisionLocalAuthenticationRequest } from './contracts';

/** Deterministic reference/test implementation; it provides no security. */
export class MemoryLocalAuthentication implements PrecisionLocalAuthentication {
  #availability: PrecisionLocalAuthenticationAvailability;
  #result: PrecisionCapabilityResult<undefined> = { status: 'success', value: undefined };
  requests: PrecisionLocalAuthenticationRequest[] = [];
  constructor(availability: PrecisionLocalAuthenticationAvailability = { status: 'available', enrolled: true }) { this.#availability = availability; }
  async availability(): Promise<PrecisionLocalAuthenticationAvailability> { return { ...this.#availability }; }
  async authenticate(request: PrecisionLocalAuthenticationRequest): Promise<PrecisionCapabilityResult<undefined>> {
    this.requests.push({ ...request });
    return { ...this.#result } as PrecisionCapabilityResult<undefined>;
  }
  setAvailability(value: PrecisionLocalAuthenticationAvailability): void { this.#availability = value; }
  setResult(value: PrecisionCapabilityResult<undefined>): void { this.#result = value; }
}
