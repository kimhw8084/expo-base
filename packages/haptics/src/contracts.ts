import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
export const precisionHapticsCapability = 'haptics';
export type HapticIntent = 'selection' | 'confirm' | 'warning' | 'error' | 'impact';
/** Optional progressive enhancement. Product success/failure must never depend on haptic delivery. */
export interface PrecisionHaptics {
  availability(): Promise<PrecisionCapabilityAvailability>;
  perform(intent: HapticIntent): Promise<PrecisionCapabilityResult<undefined>>;
}
