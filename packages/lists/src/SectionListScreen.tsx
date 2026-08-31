import type { ReactElement, ReactNode } from 'react';
import { SectionList, View, type SectionListData, type SectionListRenderItemInfo } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export interface PrecisionSection<T> { key: string; title: string; data: readonly T[]; }
export interface SectionListScreenProps<T> {
  sections: readonly PrecisionSection<T>[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: SectionListRenderItemInfo<T, PrecisionSection<T>>) => ReactElement | null;
  renderSectionHeader: (section: PrecisionSection<T>) => ReactElement | null;
  header?: ReactNode;
  empty?: ReactNode;
  stickySectionHeadersEnabled?: boolean;
}

export function SectionListScreen<T>({ sections, keyExtractor, renderItem, renderSectionHeader, header, empty, stickySectionHeadersEnabled = true }: SectionListScreenProps<T>) {
  return (
    <View style={styles.screen}>
      <SectionList<T, PrecisionSection<T>>
        sections={sections as readonly SectionListData<T, PrecisionSection<T>>[]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        ListHeaderComponent={header ? <View style={styles.header}>{header}</View> : null}
        ListEmptyComponent={empty ? <View style={styles.empty}>{empty}</View> : null}
        stickySectionHeadersEnabled={stickySectionHeadersEnabled}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  screen: { flex: 1, minWidth: 0, backgroundColor: theme.colors.background.canvas },
  content: { flexGrow: 1, width: '100%', maxWidth: theme.contentWidths.standard, alignSelf: 'center', paddingTop: rt.insets.top + theme.spacing.xl, paddingBottom: rt.insets.bottom + theme.spacing.huge, paddingHorizontal: { compact: theme.spacing.lg, medium: theme.spacing.xl, expanded: theme.spacing.xxl } },
  header: { minWidth: 0, paddingBottom: theme.spacing.xl },
  empty: { flexGrow: 1, minWidth: 0, justifyContent: 'center' },
}));
