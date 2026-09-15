import { createExpoBaseCapabilityRegistry } from '@expo-base/capabilities';
import { MemoryDevice } from '@expo-base/device';
import { MemoryHaptics } from '@expo-base/haptics';
import { MemoryLocalAuthentication } from '@expo-base/local-auth';
import { MemoryDocumentPicker, MemoryMediaAcquisition } from '@expo-base/media';
import { MemoryNotifications } from '@expo-base/notifications';
import { RecordingObservability } from '@expo-base/observability';
import { MemoryPreferences } from '@expo-base/preferences';
import { MemoryAppLifecycle, MemoryConnectivity } from '@expo-base/runtime-capabilities';
import { MemorySecureStorage } from '@expo-base/secure-storage';
import { MemoryClipboard, MemorySharing } from '@expo-base/sharing/runtime';
import { MemoryUpdates } from '@expo-base/updates';

/** Deterministic lab fixtures only. They do not claim hardware/native acceptance. */
export const referenceCapabilities = createExpoBaseCapabilityRegistry({
  secureStorage: new MemorySecureStorage(),
  preferences: new MemoryPreferences(),
  connectivity: new MemoryConnectivity({ status: 'online', internetReachable: true }),
  appLifecycle: new MemoryAppLifecycle('active'),
  clipboard: new MemoryClipboard(),
  sharing: new MemorySharing(),
  documents: new MemoryDocumentPicker(),
  media: new MemoryMediaAcquisition(),
  localAuthentication: new MemoryLocalAuthentication(),
  notifications: new MemoryNotifications(),
  updates: new MemoryUpdates(),
  device: new MemoryDevice(),
  haptics: new MemoryHaptics(),
  observability: new RecordingObservability(),
});
