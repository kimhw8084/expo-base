import type { KeyValueStorageAdapter } from '@precision-calm/adapters';
import type { PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionSecureStorage } from './contracts';

/**
 * Explicit composition bridge for adapters that intentionally need secret
 * persistence. It never downgrades to ordinary preferences or web storage.
 */
export function createSecureStorageKeyValueAdapter(storage: PrecisionSecureStorage): KeyValueStorageAdapter {
  return {
    async get(key) { return unwrap(await storage.get(key)); },
    async set(key, value) { unwrap(await storage.set(key, value)); },
    async remove(key) { unwrap(await storage.remove(key)); },
  };
}

function unwrap<T>(result: PrecisionCapabilityResult<T>): T {
  if (result.status === 'success') return result.value;
  const detail = result.status === 'error' ? result.code : result.status;
  throw new Error(`Secure storage is unavailable (${detail}). Configure @precision-calm/secure-storage at the application root; secrets cannot fall back to ordinary storage.`);
}
