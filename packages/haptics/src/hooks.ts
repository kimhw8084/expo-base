import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseHapticsCapability, type ExpoBaseHaptics } from './contracts';
export function useExpoBaseHaptics(): ExpoBaseHaptics { return useExpoBaseCapability<ExpoBaseHaptics>(expoBaseHapticsCapability); }
export function useOptionalExpoBaseHaptics(): ExpoBaseHaptics | null { return useOptionalExpoBaseCapability<ExpoBaseHaptics>(expoBaseHapticsCapability); }
