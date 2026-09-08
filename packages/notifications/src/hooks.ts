import { useOptionalPrecisionCapability, usePrecisionCapability } from '@precision-calm/capabilities';
import { precisionNotificationsCapability, type PrecisionNotifications } from './contracts';
export function usePrecisionNotifications(): PrecisionNotifications { return usePrecisionCapability<PrecisionNotifications>(precisionNotificationsCapability); }
export function useOptionalPrecisionNotifications(): PrecisionNotifications | null { return useOptionalPrecisionCapability<PrecisionNotifications>(precisionNotificationsCapability); }
