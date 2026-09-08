import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult } from '@precision-calm/capabilities';
import type { PrecisionDevice as PrecisionDeviceContract, PrecisionDeviceClass, PrecisionDeviceInfo, PrecisionDevicePlatform } from './contracts';

export class ExpoDevice implements PrecisionDeviceContract {
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async getInfo(): Promise<PrecisionCapabilityResult<PrecisionDeviceInfo>> {
    try {
      return {
        status: 'success',
        value: {
          platform: normalizePlatform(Platform.OS),
          deviceClass: normalizeDeviceClass(Device.deviceType, Platform.OS),
          appVersion: Application.nativeApplicationVersion ?? null,
          buildVersion: Application.nativeBuildVersion ?? null,
          isPhysicalDevice: Platform.OS === 'web' ? null : Device.isDevice,
        },
      };
    } catch { return { status: 'error', code: 'device_info_failed' }; }
  }
}

function normalizePlatform(platform: string): PrecisionDevicePlatform { return platform === 'ios' || platform === 'android' || platform === 'web' ? platform : 'unknown'; }
function normalizeDeviceClass(type: Device.DeviceType | null, platform: string): PrecisionDeviceClass {
  if (platform === 'web') return 'desktop';
  if (type === Device.DeviceType.PHONE) return 'phone';
  if (type === Device.DeviceType.TABLET) return 'tablet';
  return 'unknown';
}
