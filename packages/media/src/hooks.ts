import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionDocumentsCapability, precisionMediaCapability, type PrecisionDocumentPicker, type PrecisionMediaAcquisition } from './contracts';
export function usePrecisionDocumentPicker(): PrecisionDocumentPicker { return usePrecisionCapability<PrecisionDocumentPicker>(precisionDocumentsCapability); }
export function useOptionalPrecisionDocumentPicker(): PrecisionDocumentPicker | null { return useOptionalPrecisionCapability<PrecisionDocumentPicker>(precisionDocumentsCapability); }
export function usePrecisionMediaAcquisition(): PrecisionMediaAcquisition { return usePrecisionCapability<PrecisionMediaAcquisition>(precisionMediaCapability); }
export function useOptionalPrecisionMediaAcquisition(): PrecisionMediaAcquisition | null { return useOptionalPrecisionCapability<PrecisionMediaAcquisition>(precisionMediaCapability); }
