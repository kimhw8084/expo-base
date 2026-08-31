import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { NavigationItemButton } from './NavigationItemButton';
import type { NavigationItem } from './types';

export interface BottomNavigationProps { items: readonly NavigationItem[]; activeKey: string; onNavigate: (key: string) => void; }
export function BottomNavigation({ items, activeKey, onNavigate }: BottomNavigationProps) {
  return (
    <View style={styles.root} accessibilityRole="tablist">
      {items.map((item) => <NavigationItemButton key={item.key} item={item} active={item.key === activeKey} mode="bottom" onPress={() => onNavigate(item.key)} />)}
    </View>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  root: { minWidth: 0, flexDirection: 'row', gap: theme.spacing.xs, paddingTop: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, paddingBottom: rt.insets.bottom + theme.spacing.xs, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.surface },
}));
