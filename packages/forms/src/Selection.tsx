import { Pressable, Switch, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { Text, VStack, useInteractionState } from '@precision-calm/primitives';

export interface CheckboxProps { label: string; checked: boolean; onChange: (checked: boolean) => void; description?: string | undefined; disabled?: boolean; error?: string | undefined; }
export function Checkbox({ label, checked, onChange, description, disabled = false, error }: CheckboxProps) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      {...interactionProps}
      style={({ pressed }) => [styles.selectionRow, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.check, checked && styles.checkOn]}>{checked ? <Icon name="check" size="xs" tone="onPrimary" strokeWidth="strong" /> : null}</View>
      <VStack gap="xs"><Text variant="label">{label}</Text>{error ? <Text variant="caption" tone="negative">{error}</Text> : description ? <Text variant="caption" tone="secondary">{description}</Text> : null}</VStack>
    </Pressable>
  );
}

export interface RadioOption { value: string; label: string; description?: string | undefined; }
export interface RadioGroupProps { label: string; value: string; options: readonly RadioOption[]; onChange: (value: string) => void; disabled?: boolean; }
export function RadioGroup({ label, value, options, onChange, disabled = false }: RadioGroupProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      <VStack gap="sm">
        {options.map((option) => <RadioItem key={option.value} option={option} selected={option.value === value} disabled={disabled} onPress={() => onChange(option.value)} />)}
      </VStack>
    </View>
  );
}
function RadioItem({ option, selected, disabled, onPress }: { option: RadioOption; selected: boolean; disabled: boolean; onPress: () => void }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      {...interactionProps}
      style={({ pressed }) => [styles.selectionRow, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <VStack gap="xs"><Text variant="label">{option.label}</Text>{option.description ? <Text variant="caption" tone="secondary">{option.description}</Text> : null}</VStack>
    </Pressable>
  );
}

export interface SwitchFieldProps { label: string; value: boolean; onChange: (value: boolean) => void; description?: string | undefined; disabled?: boolean; }
export function SwitchField({ label, value, onChange, description, disabled = false }: SwitchFieldProps) {
  const { theme } = useUnistyles();
  return (
    <View style={[styles.switchRow, disabled && styles.disabled]}>
      <VStack gap="xs"><Text variant="label">{label}</Text>{description ? <Text variant="caption" tone="secondary">{description}</Text> : null}</VStack>
      <Switch
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.colors.border.strong, true: theme.colors.interactive.primary }}
        thumbColor={theme.colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  selectionRow: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderRadius: theme.radii.sm, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  hovered: { backgroundColor: theme.colors.background.subtle },
  focused: { boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  check: { width: theme.formMetrics.checkboxSize, height: theme.formMetrics.checkboxSize, borderRadius: theme.radii.xs, borderWidth: 1.5, borderColor: theme.colors.border.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.surface },
  checkOn: { backgroundColor: theme.colors.interactive.primary, borderColor: theme.colors.interactive.primary },
  radio: { width: theme.formMetrics.checkboxSize, height: theme.formMetrics.checkboxSize, borderRadius: theme.radii.full, borderWidth: 1.5, borderColor: theme.colors.border.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.surface },
  radioOn: { borderColor: theme.colors.interactive.primary },
  radioDot: { width: theme.formMetrics.radioDotSize, height: theme.formMetrics.radioDotSize, borderRadius: theme.radii.full, backgroundColor: theme.colors.interactive.primary },
  switchRow: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.lg },
}));
