import { usePrecisionCapability, useOptionalPrecisionCapability } from '@precision-calm/capabilities';
import { precisionSecureStorageCapability, type PrecisionSecureStorage } from './contracts';
export function usePrecisionSecureStorage(): PrecisionSecureStorage { return usePrecisionCapability<PrecisionSecureStorage>(precisionSecureStorageCapability); }
export function useOptionalPrecisionSecureStorage(): PrecisionSecureStorage | null { return useOptionalPrecisionCapability<PrecisionSecureStorage>(precisionSecureStorageCapability); }
