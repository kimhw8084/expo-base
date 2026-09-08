import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';

export const precisionLocalAuthenticationCapability = 'localAuthentication';

export type PrecisionLocalAuthenticationAvailability = PrecisionCapabilityAvailability & {
  enrolled?: boolean | undefined;
};

export interface PrecisionLocalAuthenticationRequest {
  prompt: string;
  cancelLabel?: string | undefined;
  fallbackLabel?: string | undefined;
  requireBiometrics?: boolean | undefined;
}

/** Local device assurance only. It never authenticates a user with a backend. */
export interface PrecisionLocalAuthentication {
  availability(): Promise<PrecisionLocalAuthenticationAvailability>;
  authenticate(request: PrecisionLocalAuthenticationRequest): Promise<PrecisionCapabilityResult<undefined>>;
}
