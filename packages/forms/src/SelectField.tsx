import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { MenuGroup, MenuItem, Popover } from '@precision-calm/overlays';
import { Text, useInteractionState } from '@precision-calm/primitives';
import { FormField } from './FormField';

export interface SelectOption { value: string; label: string; description?: string | undefined; disabled?: boolean | undefined; }
export interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  disabled?: boolean;
}

export function SelectField({ id, label, value, options, onChange, placeholder = 'Select an option', description, error, required = false, disabled = false }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const { hovered, focused, interactionProps } = useInteractionState();
  const anchor = (
    <Pressable
      accessibilityRole="combobox"
      accessibilityLabel={label}
      accessibilityState={{ disabled, expanded: open }}
      disabled={disabled}
      onPress={() => setOpen((current) => !current)}
      {...interactionProps}
      style={({ pressed }) => [styles.anchor, hovered && !disabled && styles.hovered, focused && styles.focused, Boolean(error) && styles.error, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Text tone={selected ? 'primary' : 'tertiary'}>{selected?.label ?? placeholder}</Text>
      <View style={styles.spacer} />
      <Icon name="chevronDown" size="sm" tone="secondary" />
    </Pressable>
  );

  return (
    <FormField label={label} fieldId={id} required={required} description={description} error={error}>
      <Popover open={open} onOpenChange={setOpen} anchor={anchor} accessibilityLabel={`${label} options`}>
        <MenuGroup>
          {options.map((option) => (
            <MenuItem
              key={option.value}
              label={option.label}
              disabled={option.disabled}
              selected={option.value === value}
              trailing={option.value === value ? <Icon name="check" size="sm" tone="accent" /> : null}
              onPress={() => { onChange(option.value); setOpen(false); }}
            />
          ))}
        </MenuGroup>
      </Popover>
    </FormField>
  );
}

const styles = StyleSheet.create((theme) => ({
  anchor: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.formMetrics.inputHorizontalPadding, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radii.sm, backgroundColor: theme.colors.background.surface },
  spacer: { flex: 1 },
  hovered: { backgroundColor: theme.colors.background.subtle },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.interactive.subtle}` },
  error: { borderColor: theme.colors.feedback.negative },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity, backgroundColor: theme.colors.background.subtle },
}));
