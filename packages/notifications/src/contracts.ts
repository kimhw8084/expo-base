import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult, PrecisionPermissionAdapter } from '@precision-calm/capabilities';

export const precisionNotificationsCapability = 'notifications';

export interface PrecisionNotificationOpenEvent {
  identifier: string;
  data: Readonly<Record<string, unknown>>;
}

/** Device permission/token/open-event boundary. Push backend and business routing remain product-owned. */
export interface PrecisionNotifications {
  availability(): Promise<PrecisionCapabilityAvailability>;
  permission: PrecisionPermissionAdapter;
  getToken(options?: { projectId?: string | undefined }): Promise<PrecisionCapabilityResult<string>>;
  subscribeOpen(listener: (event: PrecisionNotificationOpenEvent) => void): () => void;
}
