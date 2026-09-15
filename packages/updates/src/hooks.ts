import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseUpdatesCapability, type ExpoBaseUpdates } from './contracts';
export function useExpoBaseUpdates(): ExpoBaseUpdates { return useExpoBaseCapability<ExpoBaseUpdates>(expoBaseUpdatesCapability); }
export function useOptionalExpoBaseUpdates(): ExpoBaseUpdates | null { return useOptionalExpoBaseCapability<ExpoBaseUpdates>(expoBaseUpdatesCapability); }
