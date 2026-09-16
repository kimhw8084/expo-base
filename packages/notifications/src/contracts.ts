import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult, ExpoBasePermissionAdapter } from '@expo-base/capabilities';

export const expoBaseNotificationsCapability = 'notifications';

export interface ExpoBaseNotificationOpenEvent {
  identifier: string;
  data: Readonly<Record<string, unknown>>;
}

/** Device permission/token/open-event boundary. Push backend and business routing remain product-owned. */
export interface ExpoBaseNotifications {
  availability(): Promise<ExpoBaseCapabilityAvailability>;
  permission: ExpoBasePermissionAdapter;
  getToken(options?: { projectId?: string | undefined }): Promise<ExpoBaseCapabilityResult<string>>;
  subscribeOpen(listener: (event: ExpoBaseNotificationOpenEvent) => void): () => void;
}
