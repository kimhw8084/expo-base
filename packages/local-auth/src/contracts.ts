import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';

export const expoBaseLocalAuthenticationCapability = 'localAuthentication';

export type ExpoBaseLocalAuthenticationAvailability = ExpoBaseCapabilityAvailability & {
  enrolled?: boolean | undefined;
};

export interface ExpoBaseLocalAuthenticationRequest {
  prompt: string;
  cancelLabel?: string | undefined;
  fallbackLabel?: string | undefined;
  requireBiometrics?: boolean | undefined;
}

/** Local device assurance only. It never authenticates a user with a backend. */
export interface ExpoBaseLocalAuthentication {
  availability(): Promise<ExpoBaseLocalAuthenticationAvailability>;
  authenticate(request: ExpoBaseLocalAuthenticationRequest): Promise<ExpoBaseCapabilityResult<undefined>>;
}
