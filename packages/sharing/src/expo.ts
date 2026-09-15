import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseClipboard, ExpoBaseShareRequest, ExpoBaseSharing } from './contracts';

export class ExpoClipboard implements ExpoBaseClipboard {
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  async copyText(value: string): Promise<ExpoBaseCapabilityResult<undefined>> {
    try { await Clipboard.setStringAsync(value); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'clipboard_write_failed' }; }
  }
  async readText(): Promise<ExpoBaseCapabilityResult<string>> {
    try { return { status: 'success', value: await Clipboard.getStringAsync() }; }
    catch { return { status: 'error', code: 'clipboard_read_failed' }; }
  }
}

export class ExpoSharing implements ExpoBaseSharing {
  async availability(): Promise<ExpoBaseCapabilityAvailability> {
    try { return await Sharing.isAvailableAsync() ? { status: 'available' } : { status: 'unavailable', reason: 'unsupported' }; }
    catch { return { status: 'unavailable', reason: 'temporarily-unavailable' }; }
  }
  async share(request: ExpoBaseShareRequest): Promise<ExpoBaseCapabilityResult<undefined>> {
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
