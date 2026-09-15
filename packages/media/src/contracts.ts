import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult, ExpoBasePermissionAdapter } from '@expo-base/capabilities';

export const expoBaseDocumentsCapability = 'documents';
export const expoBaseMediaCapability = 'media';

export interface ExpoBaseAcquiredResource {
  uri: string;
  name: string | null;
  mimeType: string | null;
  size: number | null;
  kind: 'document' | 'image' | 'video';
  width?: number | undefined;
  height?: number | undefined;
  durationMs?: number | undefined;
}

export interface ExpoBaseDocumentPickOptions {
  mimeTypes?: readonly string[] | undefined;
  multiple?: boolean | undefined;
}

export interface ExpoBaseDocumentPicker {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  pick(options?: ExpoBaseDocumentPickOptions): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>>;
}

export interface ExpoBaseMediaPickOptions {
  mediaTypes?: readonly ('image' | 'video')[] | undefined;
  multiple?: boolean | undefined;
  allowsEditing?: boolean | undefined;
}

export interface ExpoBaseMediaAcquisition {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  libraryPermission: ExpoBasePermissionAdapter;
  cameraPermission: ExpoBasePermissionAdapter;
  pickFromLibrary(options?: ExpoBaseMediaPickOptions): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>>;
  captureWithCamera(options?: Omit<ExpoBaseMediaPickOptions, 'multiple'>): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>>;
}
