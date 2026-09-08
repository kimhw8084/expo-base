import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { HapticIntent, PrecisionHaptics } from './contracts';
export class ExpoHaptics implements PrecisionHaptics {
  async availability(): Promise<PrecisionCapabilityAvailability> { return Platform.OS === 'web' ? { status: 'unavailable', reason: 'unsupported' } : { status: 'available' }; }
  async perform(intent: HapticIntent): Promise<PrecisionCapabilityResult<undefined>> {
    const availability = await this.availability();
    if (availability.status !== 'available') return availability;
    try {
      if (intent === 'selection') await Haptics.selectionAsync();
      else if (intent === 'confirm') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (intent === 'warning') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else if (intent === 'error') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { status: 'success', value: undefined };
    } catch { return { status: 'unavailable', reason: 'temporarily-unavailable' }; }
  }
}
