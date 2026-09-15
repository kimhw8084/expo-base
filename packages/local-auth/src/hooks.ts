import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseLocalAuthenticationCapability, type ExpoBaseLocalAuthentication } from './contracts';
export function useExpoBaseLocalAuthentication(): ExpoBaseLocalAuthentication { return useExpoBaseCapability<ExpoBaseLocalAuthentication>(expoBaseLocalAuthenticationCapability); }
export function useOptionalExpoBaseLocalAuthentication(): ExpoBaseLocalAuthentication | null { return useOptionalExpoBaseCapability<ExpoBaseLocalAuthentication>(expoBaseLocalAuthenticationCapability); }
