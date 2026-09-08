import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionSecureStorage, PrecisionSecureStorageOptions } from './contracts';

/** Expo SecureStore boundary. Web is intentionally unavailable: secrets never fall back to web storage. */
export class ExpoSecureStorage implements PrecisionSecureStorage {
  readonly #prefix: string;
  constructor(options: PrecisionSecureStorageOptions) {
    const namespace = options.namespace.trim();
    if (!/^[a-z][a-z0-9._-]{0,63}$/i.test(namespace)) throw new Error('Secure storage namespace must be a short safe identifier.');
    this.#prefix = `${namespace}:v${options.version ?? 1}:`;
  }
  async availability(): Promise<PrecisionCapabilityAvailability> {
    if (Platform.OS === 'web') return { status: 'unavailable', reason: 'unsupported' };
    try { return await SecureStore.isAvailableAsync() ? { status: 'available' } : { status: 'unavailable', reason: 'temporarily-unavailable' }; }
    catch { return { status: 'unavailable', reason: 'temporarily-unavailable' }; }
  }
  async get(key: string): Promise<PrecisionCapabilityResult<string | null>> {
    const unavailable = await this.#unavailable(); if (unavailable) return unavailable;
    try { return { status: 'success', value: await SecureStore.getItemAsync(this.#key(key)) }; }
    catch { return { status: 'error', code: 'secure_storage_read_failed' }; }
  }
  async set(key: string, value: string): Promise<PrecisionCapabilityResult<undefined>> {
    const unavailable = await this.#unavailable(); if (unavailable) return unavailable;
    try { await SecureStore.setItemAsync(this.#key(key), value); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'secure_storage_write_failed' }; }
  }
  async remove(key: string): Promise<PrecisionCapabilityResult<undefined>> {
    const unavailable = await this.#unavailable(); if (unavailable) return unavailable;
    try { await SecureStore.deleteItemAsync(this.#key(key)); return { status: 'success', value: undefined }; }
    catch { return { status: 'error', code: 'secure_storage_remove_failed' }; }
  }
  async #unavailable(): Promise<Exclude<PrecisionCapabilityAvailability, { status: 'available' }> | null> { const value = await this.availability(); return value.status === 'available' ? null : value; }
  #key(key: string): string { if (!/^[a-z][a-z0-9._-]{0,127}$/i.test(key)) throw new Error('Secure storage keys must be short safe identifiers.'); return `${this.#prefix}${key}`; }
}
