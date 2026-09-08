import type { ReactElement, ReactNode } from 'react';
import { FlatList, View, type ListRenderItemInfo } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { SpacingToken } from '@precision-calm/tokens';

export interface ListScreenProps<T> {
  items: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: ListRenderItemInfo<T>) => ReactElement | null;
  header?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  loading?: boolean;
  loadingComponent?: ReactNode;
  gap?: Exclude<SpacingToken, 'none' | 'xxs'>;
  refreshing?: boolean;
  onRefresh?: (() => void) | undefined;
  onEndReached?: (() => void) | undefined;
  onEndReachedThreshold?: number;
  testID?: string;
}

export function ListScreen<T>({ items, keyExtractor, renderItem, header, footer, empty, loading = false, loadingComponent, gap = 'sm', refreshing = false, onRefresh, onEndReached, onEndReachedThreshold = 0.5, testID }: ListScreenProps<T>) {
  const Separator = () => <View style={styles[`separator_${gap}`]} />;
  const resolvedEmpty = loading ? loadingComponent : empty;
  return (
    <View style={styles.screen} accessibilityState={{ busy: loading || refreshing }}>
      <FlatList
        data={items as T[]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
        ListFooterComponent={footer ? <View style={styles.footer}>{footer}</View> : null}
        ListEmptyComponent={resolvedEmpty ? <View style={styles.empty}>{resolvedEmpty}</View> : null}
        ItemSeparatorComponent={Separator}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: { flex: 1, minWidth: 0, backgroundColor: theme.colors.background.canvas },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidths.standard, alignSelf: 'center', paddingTop: rt.insets.top + theme.spacing.xl, paddingBottom: rt.insets.bottom + theme.spacing.huge, paddingHorizontal: { compact: theme.spacing.lg, medium: theme.spacing.xl, expanded: theme.spacing.xxl } },
  header: { minWidth: 0, paddingBottom: theme.spacing.xl },
  footer: { minWidth: 0, paddingTop: theme.spacing.xl },
  empty: { flexGrow: 1, minWidth: 0, justifyContent: 'center' },
  separator_xs: { height: theme.spacing.xs },
  separator_sm: { height: theme.spacing.sm },
  separator_md: { height: theme.spacing.md },
  separator_lg: { height: theme.spacing.lg },
  separator_xl: { height: theme.spacing.xl },
  separator_xxl: { height: theme.spacing.xxl },
  separator_xxxl: { height: theme.spacing.xxxl },
  separator_huge: { height: theme.spacing.huge },
  separator_massive: { height: theme.spacing.massive },
}));
