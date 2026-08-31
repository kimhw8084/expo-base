import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';

export interface MenuItemProps { label: string; onPress: () => void; icon?: IconName; destructive?: boolean; disabled?: boolean; selected?: boolean; trailing?: ReactNode; }
export function MenuItem({ label, onPress, icon, destructive = false, disabled = false, selected = false, trailing }: MenuItemProps) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable accessibilityRole="menuitem" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} {...interactionProps} style={({ pressed }) => [styles.item, selected && styles.selected, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
      {icon ? <Icon name={icon} size="sm" tone={destructive ? 'negative' : 'secondary'} /> : null}
      <Text variant="label" tone={destructive ? 'negative' : 'primary'}>{label}</Text>
      <View style={styles.spacer} />{trailing}
    </Pressable>
  );
}
export function MenuGroup({ children }: { children: ReactNode }) { return <View accessibilityRole="menu" style={styles.group}>{children}</View>; }
const styles = StyleSheet.create((theme) => ({
  group: { minWidth: theme.componentMetrics.menuMinWidth, padding: theme.spacing.xs },
  item: { minWidth: 0, minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.transparent },
  selected: { backgroundColor: theme.colors.interactive.subtle },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  focused: { borderColor: theme.colors.border.focus },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  spacer: { flex: 1 },
}));
