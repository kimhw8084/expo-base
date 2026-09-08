import { MemorySessionSecurityAdapter } from '@precision-calm/session-security';

/** Deterministic reference-only session lock. Production apps inject a device-backed adapter. */
export const sessionSecurity = new MemorySessionSecurityAdapter();
