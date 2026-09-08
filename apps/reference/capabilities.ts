import { createPrecisionCapabilityRegistry } from '@precision-calm/capabilities';
import { MemoryDevice } from '@precision-calm/device';
import { MemoryHaptics } from '@precision-calm/haptics';
import { MemoryLocalAuthentication } from '@precision-calm/local-auth';
import { MemoryDocumentPicker, MemoryMediaAcquisition } from '@precision-calm/media';
import { MemoryNotifications } from '@precision-calm/notifications';
import { RecordingObservability } from '@precision-calm/observability';
import { MemoryPreferences } from '@precision-calm/preferences';
import { MemoryAppLifecycle, MemoryConnectivity } from '@precision-calm/runtime-capabilities';
import { MemorySecureStorage } from '@precision-calm/secure-storage';
import { MemoryClipboard, MemorySharing } from '@precision-calm/sharing/runtime';
import { MemoryUpdates } from '@precision-calm/updates';

/** Deterministic lab fixtures only. They do not claim hardware/native acceptance. */
export const referenceCapabilities = createPrecisionCapabilityRegistry({
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
