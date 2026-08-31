import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';

export interface ChipProps { label: string; selected?: boolean; disabled?: boolean; icon?: IconName; onPress: () => void; }
export function Chip({ label, selected = false, disabled = false, icon, onPress }: ChipProps) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} accessibilityLabel={label} disabled={disabled} onPress={onPress} {...interactionProps}
      style={({ pressed }) => [styles.base, selected && styles.selected, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
      {icon ? <Icon name={icon} size="xs" tone={selected ? 'accent' : 'secondary'} /> : null}<Text variant="label" tone={selected ? 'primary' : 'secondary'}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create((theme) => ({
  base: { minHeight: theme.controlHeights.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.full, borderWidth: 1, borderColor: theme.colors.border.default, backgroundColor: theme.colors.background.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs },
  selected: { backgroundColor: theme.colors.interactive.subtle, borderColor: theme.colors.interactive.primary },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  focused: { boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
