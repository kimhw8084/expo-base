import { useCallback } from 'react';
import { usePrecisionI18n } from '@precision-calm/ui';

/** Routes use this only for reference copy that should participate in locale stress modes. */
export function useReferenceCopy() {
  const { t } = usePrecisionI18n();
  return useCallback((fallback: string) => t('reference.demo.copy', undefined, fallback), [t]);
}
