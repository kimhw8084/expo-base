import { usePrecisionCapability, useOptionalPrecisionCapability } from '@precision-calm/capabilities';
import { precisionPreferencesCapability, type PrecisionPreferences } from './contracts';
export function usePrecisionPreferences(): PrecisionPreferences { return usePrecisionCapability<PrecisionPreferences>(precisionPreferencesCapability); }
export function useOptionalPrecisionPreferences(): PrecisionPreferences | null { return useOptionalPrecisionCapability<PrecisionPreferences>(precisionPreferencesCapability); }
