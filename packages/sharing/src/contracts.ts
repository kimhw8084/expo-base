import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';

export const expoBaseClipboardCapability = 'clipboard';
export const expoBaseSharingCapability = 'sharing';

export interface ExpoBaseClipboard {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  copyText(value: string): Promise<ExpoBaseCapabilityResult<undefined>>;
  readText?(): Promise<ExpoBaseCapabilityResult<string>>;
}

export interface ExpoBaseShareRequest {
  url: string;
  title?: string | undefined;
  mimeType?: string | undefined;
  dialogTitle?: string | undefined;
}

export interface ExpoBaseSharing {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  share(request: ExpoBaseShareRequest): Promise<ExpoBaseCapabilityResult<undefined>>;
}
