import { useExpoBaseCapability, useOptionalExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseSecureStorageCapability, type ExpoBaseSecureStorage } from './contracts';
export function useExpoBaseSecureStorage(): ExpoBaseSecureStorage { return useExpoBaseCapability<ExpoBaseSecureStorage>(expoBaseSecureStorageCapability); }
export function useOptionalExpoBaseSecureStorage(): ExpoBaseSecureStorage | null { return useOptionalExpoBaseCapability<ExpoBaseSecureStorage>(expoBaseSecureStorageCapability); }
