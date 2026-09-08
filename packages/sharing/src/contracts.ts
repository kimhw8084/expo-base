import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';

export const precisionClipboardCapability = 'clipboard';
export const precisionSharingCapability = 'sharing';

export interface PrecisionClipboard {
  availability(): Promise<PrecisionCapabilityAvailability>;
  copyText(value: string): Promise<PrecisionCapabilityResult<undefined>>;
  readText?(): Promise<PrecisionCapabilityResult<string>>;
}

export interface PrecisionShareRequest {
  url: string;
  title?: string | undefined;
  mimeType?: string | undefined;
  dialogTitle?: string | undefined;
}

export interface PrecisionSharing {
  availability(): Promise<PrecisionCapabilityAvailability>;
  share(request: PrecisionShareRequest): Promise<PrecisionCapabilityResult<undefined>>;
}
