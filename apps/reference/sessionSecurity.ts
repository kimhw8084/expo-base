import { MemorySessionSecurityAdapter } from '@expo-base/session-security';

/** Deterministic reference-only session lock. Production apps inject a device-backed adapter. */
export const sessionSecurity = new MemorySessionSecurityAdapter();
