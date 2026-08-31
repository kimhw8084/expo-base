import { Pressable, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, useInteractionState } from '@precision-calm/primitives';

export interface TabItem { key: string; label: string; disabled?: boolean | undefined; }
export interface TabsProps { items: readonly TabItem[]; activeKey: string; onChange: (key: string) => void; accessibilityLabel?: string; }
export function Tabs({ items, activeKey, onChange, accessibilityLabel = 'Sections' }: TabsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroller} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {items.map((item) => <TabButton key={item.key} item={item} active={item.key === activeKey} onPress={() => onChange(item.key)} />)}
    </ScrollView>
  );
}
function TabButton({ item, active, onPress }: { item: TabItem; active: boolean; onPress: () => void }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return <Pressable accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active, disabled: item.disabled }} disabled={item.disabled} onPress={onPress} {...interactionProps} style={({ pressed }) => [styles.tab, active && styles.active, hovered && !item.disabled && styles.hovered, focused && styles.focused, pressed && !item.disabled && styles.pressed, item.disabled && styles.disabled]}><Text variant="label" tone={active ? 'primary' : 'secondary'} numberOfLines={1}>{item.label}</Text></Pressable>;
}
const styles = StyleSheet.create((theme) => ({
  scroller: { gap: theme.spacing.xs, padding: theme.spacing.xs },
  tab: { minHeight: theme.controlHeights.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.transparent },
  active: { backgroundColor: theme.colors.background.subtle },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  focused: { borderColor: theme.colors.border.focus },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
