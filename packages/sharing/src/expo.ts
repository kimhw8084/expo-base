import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionClipboard, PrecisionShareRequest, PrecisionSharing } from './contracts';

export class ExpoClipboard implements PrecisionClipboard {
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async copyText(value: string): Promise<PrecisionCapabilityResult<undefined>> {
    try { await Clipboard.setStringAsync(value); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'clipboard_write_failed' }; }
  }
  async readText(): Promise<PrecisionCapabilityResult<string>> {
    try { return { status: 'success', value: await Clipboard.getStringAsync() }; }
    catch { return { status: 'error', code: 'clipboard_read_failed' }; }
  }
}

export class ExpoSharing implements PrecisionSharing {
  async availability(): Promise<PrecisionCapabilityAvailability> {
    try { return await Sharing.isAvailableAsync() ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
    catch { return { status: 'unavailable', reason: 'temporarily-unavailable' }; }
  }
  async share(request: PrecisionShareRequest): Promise<PrecisionCapabilityResult<undefined>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try {
      await Sharing.shareAsync(request.url, {
        ...(request.mimeType ? { mimeType: request.mimeType } : {}),
        ...(request.dialogTitle ? { dialogTitle: request.dialogTitle } : {}),
      });
      return { status: 'success', value: undefined };
    } catch { return { status: 'error', code: 'share_failed' }; }
  }
}
