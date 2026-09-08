import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionHapticsCapability, type PrecisionHaptics } from './contracts';
export function usePrecisionHaptics(): PrecisionHaptics { return usePrecisionCapability<PrecisionHaptics>(precisionHapticsCapability); }
export function useOptionalPrecisionHaptics(): PrecisionHaptics | null { return useOptionalPrecisionCapability<PrecisionHaptics>(precisionHapticsCapability); }
