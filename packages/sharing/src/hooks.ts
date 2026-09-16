import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseClipboardCapability, expoBaseSharingCapability, type ExpoBaseClipboard, type ExpoBaseSharing } from './contracts';
export function useExpoBaseClipboard(): ExpoBaseClipboard { return useExpoBaseCapability<ExpoBaseClipboard>(expoBaseClipboardCapability); }
export function useOptionalExpoBaseClipboard(): ExpoBaseClipboard | null { return useOptionalExpoBaseCapability<ExpoBaseClipboard>(expoBaseClipboardCapability); }
export function useExpoBaseSharing(): ExpoBaseSharing { return useExpoBaseCapability<ExpoBaseSharing>(expoBaseSharingCapability); }
export function useOptionalExpoBaseSharing(): ExpoBaseSharing | null { return useOptionalExpoBaseCapability<ExpoBaseSharing>(expoBaseSharingCapability); }
