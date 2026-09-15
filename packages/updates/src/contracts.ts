import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult } from '@expo-base/capabilities';

export const expoBaseUpdatesCapability = 'updates';

export type ExpoBaseUpdateCheck =
  | { status: 'up-to-date' }
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'unsupported' | 'configuration-missing' | 'temporarily-unavailable' }
  | { status: 'error'; code: string };

/** Update policy remains application/release-owned: checking, downloading, and applying are never automatic. */
export interface ExpoBaseUpdates {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  check(): Promise<ExpoBaseUpdateCheck>;
  download(): Promise<ExpoBaseCapabilityResult<{ downloaded: boolean }>>;
  reload(): Promise<ExpoBaseCapabilityResult<undefined>>;
}
