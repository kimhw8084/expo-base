import { forwardRef, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';

export interface MenuItemProps { label: string; onPress: () => void; icon?: IconName; destructive?: boolean; disabled?: boolean; selected?: boolean; trailing?: ReactNode; tabIndex?: 0 | -1; onKeyDown?: ((event: { key: string; preventDefault: () => void }) => void) | undefined; }
export const MenuItem = forwardRef<ComponentRef<typeof Pressable>, MenuItemProps>(function MenuItem({ label, onPress, icon, destructive = false, disabled = false, selected = false, trailing, tabIndex, onKeyDown }, ref) {
  const { hovered, focused, interactionProps } = useInteractionState();
  const keyboardProps = Platform.OS === 'web' && onKeyDown ? { onKeyDown } : {};
  return (
    <Pressable ref={ref} accessibilityRole="menuitem" role="menuitem" accessibilityLabel={label} aria-label={label} accessibilityState={{ disabled, selected }} aria-disabled={disabled} aria-selected={selected} disabled={disabled} tabIndex={tabIndex} onPress={onPress} {...keyboardProps} {...interactionProps} style={({ pressed }) => [styles.item, selected && styles.selected, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
      {icon ? <Icon name={icon} size="sm" tone={destructive ? 'negative' : 'secondary'} /> : null}
      <Text variant="label" tone={destructive ? 'negative' : 'primary'}>{label}</Text>
      <View style={styles.spacer} />{trailing}
    </Pressable>
  );
});
export interface MenuGroupProps { children: ReactNode; accessibilityLabel?: string | undefined; nativeID?: string | undefined; testID?: string | undefined; }
export function MenuGroup({ children, accessibilityLabel, nativeID, testID }: MenuGroupProps) { return <View nativeID={nativeID} accessibilityRole="menu" role="menu" style={styles.group} accessibilityLabel={accessibilityLabel} testID={testID}>{children}</View>; }
const styles = StyleSheet.create((theme) => ({
  group: { minWidth: theme.componentMetrics.menuMinWidth, padding: theme.spacing.xs },
  item: { minWidth: 0, minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  selected: { backgroundColor: theme.colors.interactive.subtle },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  spacer: { flex: 1 },
}));
