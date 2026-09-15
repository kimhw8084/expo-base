import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
import type { ExpoBaseUpdateCheck, ExpoBaseUpdates } from './contracts';

export class ExpoUpdates implements ExpoBaseUpdates {
  async availability(): Promise<ExpoBaseCapabilityAvailability> {
    if (Platform.OS === 'web') return { status: 'unavailable', reason: 'unsupported' };
    return Updates.isEnabled ? { status: 'available' } : { status: 'unavailable', reason: 'configuration-missing' };
  }
  async check(): Promise<ExpoBaseUpdateCheck> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try { return (await Updates.checkForUpdateAsync()).isAvailable ? { status: 'available' } : { status: 'up-to-date' }; }
    catch { return { status: 'error', code: 'update_check_failed' }; }
  }
  async download(): Promise<ExpoBaseCapabilityResult<{ downloaded: boolean }>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try { return { status: 'success', value: { downloaded: (await Updates.fetchUpdateAsync()).isNew } }; }
    catch { return { status: 'error', code: 'update_download_failed' }; }
  }
  async reload(): Promise<ExpoBaseCapabilityResult<undefined>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try { await Updates.reloadAsync(); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'update_reload_failed' }; }
  }
}
