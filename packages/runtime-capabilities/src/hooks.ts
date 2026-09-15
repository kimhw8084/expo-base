import { useExpoBaseCapability, useOptionalExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseAppLifecycleCapability, expoBaseConnectivityCapability, type ExpoBaseAppLifecycle, type ExpoBaseConnectivity } from './contracts';

export function useExpoBaseConnectivity(): ExpoBaseConnectivity { return useExpoBaseCapability<ExpoBaseConnectivity>(expoBaseConnectivityCapability); }
export function useOptionalExpoBaseConnectivity(): ExpoBaseConnectivity | null { return useOptionalExpoBaseCapability<ExpoBaseConnectivity>(expoBaseConnectivityCapability); }
export function useExpoBaseAppLifecycle(): ExpoBaseAppLifecycle { return useExpoBaseCapability<ExpoBaseAppLifecycle>(expoBaseAppLifecycleCapability); }
export function useOptionalExpoBaseAppLifecycle(): ExpoBaseAppLifecycle | null { return useOptionalExpoBaseCapability<ExpoBaseAppLifecycle>(expoBaseAppLifecycleCapability); }
