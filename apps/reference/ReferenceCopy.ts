import { useCallback } from 'react';
import { useExpoBaseI18n } from '@expo-base/ui';

/** Routes use this only for reference copy that should participate in locale stress modes. */
export function useReferenceCopy() {
  const { t } = useExpoBaseI18n();
  return useCallback((fallback: string) => t('reference.demo.copy', undefined, fallback), [t]);
}
