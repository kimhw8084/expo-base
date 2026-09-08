import { Linking, Platform } from 'react-native';
import type { NotificationPermissionsStatus } from 'expo-notifications';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult, PrecisionPermissionAdapter, PrecisionPermissionSnapshot } from '@precision-calm/capabilities';
import type { PrecisionNotificationOpenEvent, PrecisionNotifications } from './contracts';

class ExpoNotificationsPermission implements PrecisionPermissionAdapter {
  async get(): Promise<PrecisionPermissionSnapshot> { if (Platform.OS === 'web') return unavailablePermission(); try { const notifications = await loadNotifications(); return normalizePermission(await notifications.getPermissionsAsync()); } catch { return unavailablePermission(); } }
  async request(): Promise<PrecisionPermissionSnapshot> { if (Platform.OS === 'web') return unavailablePermission(); try { const notifications = await loadNotifications(); return normalizePermission(await notifications.requestPermissionsAsync()); } catch { return unavailablePermission(); } }
  async openSettings(): Promise<PrecisionCapabilityResult<undefined>> {
    try { await Linking.openSettings(); return { status: 'success', value: undefined }; }
    catch { return { status: 'unavailable', reason: 'unsupported' }; }
  }
}

export class ExpoNotifications implements PrecisionNotifications {
  readonly permission = new ExpoNotificationsPermission();
  async availability(): Promise<PrecisionCapabilityAvailability> {
    return Platform.OS === 'web' ? { status: 'unavailable', reason: 'unsupported' } : { status: 'available' };
  }
  async getToken(options: { projectId?: string | undefined } = {}): Promise<PrecisionCapabilityResult<string>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    const permission = await this.permission.get();
    if (permission.status !== 'granted') return permission.status === 'restricted' ? { status: 'restricted' } : { status: 'denied', canOpenSettings: permission.canOpenSettings };
    if (!options.projectId) return { status: 'unavailable', reason: 'configuration-missing' };
    try { const notifications = await loadNotifications(); return { status: 'success', value: (await notifications.getExpoPushTokenAsync({ projectId: options.projectId })).data }; }
    catch { return { status: 'error', code: 'notification_token_failed' }; }
  }
  subscribeOpen(listener: (event: PrecisionNotificationOpenEvent) => void): () => void {
    if (Platform.OS === 'web') return () => {};
    let active = true;
    let remove: (() => void) | undefined;
    void loadNotifications().then((notifications) => {
      if (!active) return;
      const subscription = notifications.addNotificationResponseReceivedListener((response) => {
        listener({ identifier: response.notification.request.identifier, data: response.notification.request.content.data ?? {} });
      });
      remove = () => subscription.remove();
      if (!active) remove();
    }).catch(() => {});
    return () => { active = false; remove?.(); };
  }
}

function unavailablePermission(): PrecisionPermissionSnapshot { return { status: 'unavailable', canAskAgain: false, canOpenSettings: false }; }
function normalizePermission(response: NotificationPermissionsStatus): PrecisionPermissionSnapshot {
  const status = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : response.status === 'undetermined' ? 'undetermined' : 'restricted';
  return { status, canAskAgain: response.canAskAgain, canOpenSettings: !response.granted && !response.canAskAgain };
}

let notificationsModule: Promise<typeof import('expo-notifications')> | undefined;
function loadNotifications() {
  notificationsModule ??= import('expo-notifications');
  return notificationsModule;
}
