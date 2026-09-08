import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';

export const precisionUpdatesCapability = 'updates';

export type PrecisionUpdateCheck =
  | { status: 'up-to-date' }
  | { status: 'available' }
  | { status: 'unavailable'; reason: 'unsupported' | 'configuration-missing' | 'temporarily-unavailable' }
  | { status: 'error'; code: string };

/** Update policy remains application/release-owned: checking, downloading, and applying are never automatic. */
export interface PrecisionUpdates {
  availability(): Promise<PrecisionCapabilityAvailability>;
  check(): Promise<PrecisionUpdateCheck>;
  download(): Promise<PrecisionCapabilityResult<{ downloaded: boolean }>>;
  reload(): Promise<PrecisionCapabilityResult<undefined>>;
}
