import { useExpoBaseCapability, useOptionalExpoBaseCapability } from '@expo-base/capabilities';
import { expoBasePreferencesCapability, type ExpoBasePreferences } from './contracts';
export function useExpoBasePreferences(): ExpoBasePreferences { return useExpoBaseCapability<ExpoBasePreferences>(expoBasePreferencesCapability); }
export function useOptionalExpoBasePreferences(): ExpoBasePreferences | null { return useOptionalExpoBaseCapability<ExpoBasePreferences>(expoBasePreferencesCapability); }
