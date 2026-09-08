import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionLocalAuthenticationCapability, type PrecisionLocalAuthentication } from './contracts';
export function usePrecisionLocalAuthentication(): PrecisionLocalAuthentication { return usePrecisionCapability<PrecisionLocalAuthentication>(precisionLocalAuthenticationCapability); }
export function useOptionalPrecisionLocalAuthentication(): PrecisionLocalAuthentication | null { return useOptionalPrecisionCapability<PrecisionLocalAuthentication>(precisionLocalAuthenticationCapability); }
