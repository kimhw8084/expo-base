import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';
export const expoBaseHapticsCapability = 'haptics';
export type HapticIntent = 'selection' | 'confirm' | 'warning' | 'error' | 'impact';
/** Optional progressive enhancement. Product success/failure must never depend on haptic delivery. */
export interface ExpoBaseHaptics {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  perform(intent: HapticIntent): Promise<ExpoBaseCapabilityResult<undefined>>;
}
