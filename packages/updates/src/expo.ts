import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionUpdateCheck, PrecisionUpdates } from './contracts';

export class ExpoUpdates implements PrecisionUpdates {
  async availability(): Promise<PrecisionCapabilityAvailability> {
    if (Platform.OS === 'web') return { status: 'unavailable', reason: 'unsupported' };
    return Updates.isEnabled ? { status: 'available' } : { status: 'unavailable', reason: 'configuration-missing' };
  }
  async check(): Promise<PrecisionUpdateCheck> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try { return (await Updates.checkForUpdateAsync()).isAvailable ? { status: 'available' } : { status: 'up-to-date' }; }
    catch { return { status: 'error', code: 'update_check_failed' }; }
  }
  async download(): Promise<PrecisionCapabilityResult<{ downloaded: boolean }>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try { return { status: 'success', value: { downloaded: (await Updates.fetchUpdateAsync()).isNew } }; }
    catch { return { status: 'error', code: 'update_download_failed' }; }
  }
  async reload(): Promise<PrecisionCapabilityResult<undefined>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try { await Updates.reloadAsync(); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'update_reload_failed' }; }
  }
}
