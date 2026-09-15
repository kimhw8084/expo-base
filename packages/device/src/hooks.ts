import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseDeviceCapability, type ExpoBaseDevice } from './contracts';
export function useExpoBaseDevice(): ExpoBaseDevice { return useExpoBaseCapability<ExpoBaseDevice>(expoBaseDeviceCapability); }
export function useOptionalExpoBaseDevice(): ExpoBaseDevice | null { return useOptionalExpoBaseCapability<ExpoBaseDevice>(expoBaseDeviceCapability); }
