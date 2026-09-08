import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult, PrecisionPermissionAdapter } from '@precision-calm/capabilities';

export const precisionDocumentsCapability = 'documents';
export const precisionMediaCapability = 'media';

export interface PrecisionAcquiredResource {
  uri: string;
  name: string | null;
  mimeType: string | null;
  size: number | null;
  kind: 'document' | 'image' | 'video';
  width?: number | undefined;
  height?: number | undefined;
  durationMs?: number | undefined;
}

export interface PrecisionDocumentPickOptions {
  mimeTypes?: readonly string[] | undefined;
  multiple?: boolean | undefined;
}

export interface PrecisionDocumentPicker {
  availability(): Promise<PrecisionCapabilityAvailability>;
  pick(options?: PrecisionDocumentPickOptions): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>>;
}

export interface PrecisionMediaPickOptions {
  mediaTypes?: readonly ('image' | 'video')[] | undefined;
  multiple?: boolean | undefined;
  allowsEditing?: boolean | undefined;
}

export interface PrecisionMediaAcquisition {
  availability(): Promise<PrecisionCapabilityAvailability>;
  libraryPermission: PrecisionPermissionAdapter;
  cameraPermission: PrecisionPermissionAdapter;
  pickFromLibrary(options?: PrecisionMediaPickOptions): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>>;
  captureWithCamera(options?: Omit<PrecisionMediaPickOptions, 'multiple'>): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>>;
}
