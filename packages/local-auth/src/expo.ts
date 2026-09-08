import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import type { PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionLocalAuthentication, PrecisionLocalAuthenticationAvailability, PrecisionLocalAuthenticationRequest } from './contracts';

export class ExpoLocalAuthentication implements PrecisionLocalAuthentication {
  async availability(): Promise<PrecisionLocalAuthenticationAvailability> {
    if (Platform.OS === 'web') return { status: 'unavailable', reason: 'unsupported' };
    try {
      const [hardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
      return hardware ? { status: 'available', enrolled } : { status: 'unavailable', reason: 'unsupported' };
    } catch { return { status: 'unavailable', reason: 'temporarily-unavailable' }; }
  }
  async authenticate(request: PrecisionLocalAuthenticationRequest): Promise<PrecisionCapabilityResult<undefined>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    if (!availability.enrolled) return { status: 'unavailable', reason: 'configuration-missing' };
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: request.prompt,
        ...(request.cancelLabel ? { cancelLabel: request.cancelLabel } : {}),
        ...(request.fallbackLabel ? { fallbackLabel: request.fallbackLabel } : {}),
        ...(request.requireBiometrics ? { disableDeviceFallback: true } : {}),
      });
      if (result.success) return { status: 'success', value: undefined };
      if (result.error === 'user_cancel' || result.error === 'app_cancel' || result.error === 'system_cancel') return { status: 'cancelled' };
      if (result.error === 'lockout') return { status: 'unavailable', reason: 'temporarily-unavailable' };
      return { status: 'denied', canOpenSettings: false };
    } catch { return { status: 'error', code: 'local_authentication_failed' }; }
  }
}
