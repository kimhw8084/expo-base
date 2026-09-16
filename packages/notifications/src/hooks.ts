import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseNotificationsCapability, type ExpoBaseNotifications } from './contracts';
export function useExpoBaseNotifications(): ExpoBaseNotifications { return useExpoBaseCapability<ExpoBaseNotifications>(expoBaseNotificationsCapability); }
export function useOptionalExpoBaseNotifications(): ExpoBaseNotifications | null { return useOptionalExpoBaseCapability<ExpoBaseNotifications>(expoBaseNotificationsCapability); }
