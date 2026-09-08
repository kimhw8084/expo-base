import { usePrecisionCapability, useOptionalPrecisionCapability } from '@precision-calm/capabilities';
import { precisionAppLifecycleCapability, precisionConnectivityCapability, type PrecisionAppLifecycle, type PrecisionConnectivity } from './contracts';

export function usePrecisionConnectivity(): PrecisionConnectivity { return usePrecisionCapability<PrecisionConnectivity>(precisionConnectivityCapability); }
export function useOptionalPrecisionConnectivity(): PrecisionConnectivity | null { return useOptionalPrecisionCapability<PrecisionConnectivity>(precisionConnectivityCapability); }
export function usePrecisionAppLifecycle(): PrecisionAppLifecycle { return usePrecisionCapability<PrecisionAppLifecycle>(precisionAppLifecycleCapability); }
export function useOptionalPrecisionAppLifecycle(): PrecisionAppLifecycle | null { return useOptionalPrecisionCapability<PrecisionAppLifecycle>(precisionAppLifecycleCapability); }
