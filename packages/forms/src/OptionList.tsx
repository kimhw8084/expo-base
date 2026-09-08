import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, useInteractionState } from '@precision-calm/primitives';

function OptionList({ id, label, multiple = false, children, testID }: { id: string; label: string; multiple?: boolean; children: ReactNode; testID?: string | undefined }) {
  const webListboxProps = { role: 'listbox', ...(multiple ? { 'aria-multiselectable': true } : {}) } as Record<string, unknown>;
  return (
    <View
      nativeID={id}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'list'}
      accessibilityLabel={label}
      aria-label={label}
      {...webListboxProps}
      style={styles.list}
      testID={testID}
    >
      {children}
    </View>
  );
}

function OptionItem({ id, label, selected, active = false, disabled = false, trailing, onPress }: { id: string; label: string; selected: boolean; active?: boolean; disabled?: boolean; trailing?: ReactNode; onPress: () => void }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      nativeID={id}
      role="option"
      accessibilityLabel={label}
      aria-label={label}
      accessibilityState={{ selected, disabled }}
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      tabIndex={-1}
      onPress={onPress}
      {...interactionProps}
      style={({ pressed }) => [styles.option, (selected || active) && styles.active, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text variant="label">{label}</Text>
      <View style={styles.spacer} />
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: { minWidth: theme.componentMetrics.menuMinWidth, padding: theme.spacing.xs },
  option: { minWidth: 0, minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  active: { backgroundColor: theme.colors.interactive.subtle },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  focused: { borderColor: theme.colors.border.focus },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  spacer: { flex: 1 },
}));

export { OptionItem, OptionList };
