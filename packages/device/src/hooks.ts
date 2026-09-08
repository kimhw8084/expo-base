import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionDeviceCapability, type PrecisionDevice } from './contracts';
export function usePrecisionDevice(): PrecisionDevice { return usePrecisionCapability<PrecisionDevice>(precisionDeviceCapability); }
export function useOptionalPrecisionDevice(): PrecisionDevice | null { return useOptionalPrecisionCapability<PrecisionDevice>(precisionDeviceCapability); }
