import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionUpdatesCapability, type PrecisionUpdates } from './contracts';
export function usePrecisionUpdates(): PrecisionUpdates { return usePrecisionCapability<PrecisionUpdates>(precisionUpdatesCapability); }
export function useOptionalPrecisionUpdates(): PrecisionUpdates | null { return useOptionalPrecisionCapability<PrecisionUpdates>(precisionUpdatesCapability); }
