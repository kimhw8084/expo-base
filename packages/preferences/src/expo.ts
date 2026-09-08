import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionPreferences, PrecisionPreferencesOptions } from './contracts';

/** AsyncStorage on native and explicit browser localStorage for non-secret device preferences. */
export class DevicePreferences implements PrecisionPreferences {
  readonly #prefix: string;
  constructor(options: PrecisionPreferencesOptions) {
    const namespace = options.namespace.trim();
    if (!/^[a-z][a-z0-9._-]{0,63}$/i.test(namespace)) throw new Error('Preference namespace must be a short safe identifier.');
    this.#prefix = `${namespace}:v${options.version ?? 1}:`;
  }
  async availability(): Promise<PrecisionCapabilityAvailability> {
    if (Platform.OS !== 'web') return { status: 'available' };
    try { return this.#webStorage() ? { status: 'available' } : { status: 'unavailable', reason: 'temporarily-unavailable' }; }
    catch { return { status: 'unavailable', reason: 'temporarily-unavailable' }; }
  }
  async get(key: string): Promise<PrecisionCapabilityResult<string | null>> {
    const availability = await this.availability(); if (availability.status !== 'available') return availability;
    try { return { status: 'success', value: Platform.OS === 'web' ? this.#webStorage().getItem(this.#key(key)) : await AsyncStorage.getItem(this.#key(key)) }; }
    catch { return { status: 'error', code: 'preferences_read_failed' }; }
  }
  async set(key: string, value: string): Promise<PrecisionCapabilityResult<undefined>> {
    const availability = await this.availability(); if (availability.status !== 'available') return availability;
    try { if (Platform.OS === 'web') this.#webStorage().setItem(this.#key(key), value); else await AsyncStorage.setItem(this.#key(key), value); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'preferences_write_failed' }; }
  }
  async remove(key: string): Promise<PrecisionCapabilityResult<undefined>> {
    const availability = await this.availability(); if (availability.status !== 'available') return availability;
    try { if (Platform.OS === 'web') this.#webStorage().removeItem(this.#key(key)); else await AsyncStorage.removeItem(this.#key(key)); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'preferences_remove_failed' }; }
  }
  #key(key: string): string { if (!/^[a-z][a-z0-9._-]{0,127}$/i.test(key)) throw new Error('Preference keys must be short safe identifiers.'); return `${this.#prefix}${key}`; }
  #webStorage(): Storage { if (!globalThis.localStorage) throw new Error('Browser storage is unavailable.'); return globalThis.localStorage; }
}
