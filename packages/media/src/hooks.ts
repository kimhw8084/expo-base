import { useOptionalExpoBaseCapability, useExpoBaseCapability } from '@expo-base/capabilities';
import { expoBaseDocumentsCapability, expoBaseMediaCapability, type ExpoBaseDocumentPicker, type ExpoBaseMediaAcquisition } from './contracts';
export function useExpoBaseDocumentPicker(): ExpoBaseDocumentPicker { return useExpoBaseCapability<ExpoBaseDocumentPicker>(expoBaseDocumentsCapability); }
export function useOptionalExpoBaseDocumentPicker(): ExpoBaseDocumentPicker | null { return useOptionalExpoBaseCapability<ExpoBaseDocumentPicker>(expoBaseDocumentsCapability); }
export function useExpoBaseMediaAcquisition(): ExpoBaseMediaAcquisition { return useExpoBaseCapability<ExpoBaseMediaAcquisition>(expoBaseMediaCapability); }
export function useOptionalExpoBaseMediaAcquisition(): ExpoBaseMediaAcquisition | null { return useOptionalExpoBaseCapability<ExpoBaseMediaAcquisition>(expoBaseMediaCapability); }
