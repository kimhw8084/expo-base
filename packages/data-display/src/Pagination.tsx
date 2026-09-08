import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, IconButton } from '@precision-calm/components';
import { paginationWindow } from '@precision-calm/platform';

export interface PaginationProps { page: number; pageCount: number; onChange: (page: number) => void; }
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const pages = paginationWindow(page, pageCount, 5);
  return <View style={styles.root}><IconButton icon="chevronLeft" label="Previous page" disabled={page <= 1} onPress={() => onChange(Math.max(1, page - 1))} />{pages.map((item) => <Button key={item} label={String(item)} size="sm" variant={item === page ? 'primary' : 'secondary'} accessibilityLabel={`Page ${item}`} onPress={() => onChange(item)} />)}<IconButton icon="chevronRight" label="Next page" disabled={page >= pageCount} onPress={() => onChange(Math.min(pageCount, page + 1))} /></View>;
}
const styles = StyleSheet.create((theme) => ({ root: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs } }));

export interface CursorPaginationProps {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  loading?: boolean;
  testID?: string | undefined;
}

/** Cursor-neutral controls: the product's server-state query owns cursor tokens and data retention. */
export function CursorPagination({ hasPreviousPage, hasNextPage, onPreviousPage, onNextPage, loading = false, testID }: CursorPaginationProps) {
  return <View accessibilityRole="toolbar" role="toolbar" accessibilityLabel="Pagination" style={styles.root} testID={testID}><IconButton icon="chevronLeft" label="Previous page" disabled={loading || !hasPreviousPage} onPress={onPreviousPage} /><IconButton icon="chevronRight" label="Next page" disabled={loading || !hasNextPage} onPress={onNextPage} /></View>;
}
