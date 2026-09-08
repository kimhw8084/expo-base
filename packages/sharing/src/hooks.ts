import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionClipboardCapability, precisionSharingCapability, type PrecisionClipboard, type PrecisionSharing } from './contracts';
export function usePrecisionClipboard(): PrecisionClipboard { return usePrecisionCapability<PrecisionClipboard>(precisionClipboardCapability); }
export function useOptionalPrecisionClipboard(): PrecisionClipboard | null { return useOptionalPrecisionCapability<PrecisionClipboard>(precisionClipboardCapability); }
export function usePrecisionSharing(): PrecisionSharing { return usePrecisionCapability<PrecisionSharing>(precisionSharingCapability); }
export function useOptionalPrecisionSharing(): PrecisionSharing | null { return useOptionalPrecisionCapability<PrecisionSharing>(precisionSharingCapability); }
