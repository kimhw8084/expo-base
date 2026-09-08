import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@precision-calm/components';
import { Text, VStack } from '@precision-calm/primitives';
import type { DataColumn, DataColumnVisibility } from './AdaptiveDataTable';

/** Controlled column visibility that protects the primary identity column. */
export function useDataColumnVisibility<T>(columns: readonly DataColumn<T>[], initialVisibleKeys?: readonly string[]) {
  const allKeys = useMemo(() => columns.map((column) => column.key), [columns]);
  const primaryKey = useMemo(() => columns.find((column) => column.primary)?.key ?? columns[0]?.key, [columns]);
  const [visibleKeys, setVisibleKeys] = useState<readonly string[]>(() => initialVisibleKeys?.filter((key) => allKeys.includes(key)) ?? allKeys);
  const visibility: DataColumnVisibility = {
    visibleKeys,
    onVisibleKeysChange: (next) => setVisibleKeys([...new Set(next.filter((key) => allKeys.includes(key)))].includes(primaryKey ?? '')
      ? [...new Set(next.filter((key) => allKeys.includes(key)))]
      : primaryKey ? [primaryKey, ...next.filter((key) => allKeys.includes(key) && key !== primaryKey)] : next),
  };
  return { ...visibility, reset: () => setVisibleKeys(allKeys), primaryKey } as const;
}

export interface InfinitePaginationProps {
  hasNextPage: boolean;
  loading?: boolean;
  error?: string | undefined;
  onLoadMore: () => void;
  onRetry?: (() => void) | undefined;
  label?: string;
  testID?: string | undefined;
}

/** Explicit cross-platform next-page control. Pull-to-refresh remains the ListScreen owner on native. */
export function InfinitePagination({ hasNextPage, loading = false, error, onLoadMore, onRetry, label = 'Load more', testID }: InfinitePaginationProps) {
  if (error) return <VStack gap="sm"><View accessibilityLiveRegion="polite" aria-live="polite"><Text variant="caption" tone="negative">{error}</Text></View><Button label="Retry" variant="secondary" loading={loading} responsiveWidth="compact-full" onPress={onRetry ?? onLoadMore} {...(testID ? { testID } : {})} /></VStack>;
  if (!hasNextPage) return <View accessibilityLiveRegion="polite" aria-live="polite"><Text variant="caption" tone="secondary">All results are loaded.</Text></View>;
  return <Button label={label} variant="secondary" loading={loading} responsiveWidth="compact-full" onPress={onLoadMore} {...(testID ? { testID } : {})} />;
}
