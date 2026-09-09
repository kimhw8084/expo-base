import { forwardRef, useRef, type ComponentRef } from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { SegmentedControl, type SegmentedControlOption } from '@precision-calm/components';
import { usePrecisionDirection } from '@precision-calm/i18n';
import { resolveRovingFocusIndex } from '@precision-calm/platform';
import { Icon } from '@precision-calm/icons';
import { Text, VStack, useInteractionState } from '@precision-calm/primitives';
import { FormField } from './FormField';

export interface CheckboxProps { id?: string; label: string; checked: boolean; onChange: (checked: boolean) => void; description?: string | undefined; disabled?: boolean; error?: string | undefined; required?: boolean; testID?: string; onBlur?: () => void; }
export const Checkbox = forwardRef<View, CheckboxProps>(function Checkbox({ id, label, checked, onChange, description, disabled = false, error, required = false, testID, onBlur }, ref) {
  const { hovered, focused, interactionProps } = useInteractionState();
  const messageId = id && (error || description) ? `${id}-message` : undefined;
  const accessibilityHint = [required ? 'Required' : null, error ? `Error: ${error}` : description].filter(Boolean).join('. ') || undefined;
  const webAccessibilityProps = Platform.OS === 'web' ? {
    'aria-describedby': messageId,
    'aria-errormessage': error ? messageId : undefined,
    'aria-invalid': Boolean(error),
    'aria-required': required,
  } : {};
  return (
    <Pressable
      ref={ref}
      accessibilityRole="checkbox"
      role="checkbox"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      aria-label={label}
      accessibilityState={{ checked, disabled }}
      aria-checked={checked}
      aria-disabled={disabled}
      {...webAccessibilityProps}
      tabIndex={disabled ? -1 : 0}
      testID={testID}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      {...interactionProps}
      onBlur={() => { interactionProps.onBlur(); onBlur?.(); }}
      style={({ pressed }) => [styles.selectionRow, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.check, checked && styles.checkOn]}>{checked ? <Icon name="check" size="xs" tone="onPrimary" strokeWidth="strong" /> : null}</View>
      <VStack gap="xs">
        <Text variant="label">{label}</Text>
        {error ? (
          <View id={messageId} accessibilityLiveRegion="polite" aria-live="polite">
            <Text variant="caption" tone="negative" testID={id ? `${id}-error` : undefined}>{error}</Text>
          </View>
        ) : description ? (
          <View id={messageId}><Text variant="caption" tone="secondary">{description}</Text></View>
        ) : null}
      </VStack>
    </Pressable>
  );
});

export interface RadioOption { value: string; label: string; description?: string | undefined; disabled?: boolean | undefined; }
export interface RadioGroupProps { id?: string; label: string; value: string; options: readonly RadioOption[]; onChange: (value: string) => void; description?: string | undefined; error?: string | undefined; required?: boolean; disabled?: boolean; testID?: string; onBlur?: () => void; }
export function RadioGroup({ id, label, value, options, onChange, description, error, required = false, disabled = false, testID, onBlur }: RadioGroupProps) {
  const fieldId = id ?? `radio-${label.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`;
  const direction = usePrecisionDirection();
  const itemRefs = useRef<Array<ComponentRef<typeof Pressable> | null>>([]);
  const enabled = options.map((option) => !disabled && !option.disabled);
  const selectedIndex = options.findIndex((option, index) => option.value === value && enabled[index]);
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : enabled.findIndex(Boolean);
  const navigate = (index: number, event: { key: string; preventDefault: () => void }) => {
    const next = resolveRovingFocusIndex(event.key, index, enabled, { orientation: 'both', direction });
    if (next === null) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
    const option = options[next];
    if (option) onChange(option.value);
  };
  return (
    <FormField label={label} fieldId={fieldId} required={required} description={description} error={error}>
      <View accessibilityRole="radiogroup" role="radiogroup" accessibilityLabel={label} accessibilityState={{ disabled }} aria-label={label} aria-required={required} aria-invalid={Boolean(error)} testID={testID}>
        <VStack gap="sm">
          {options.map((option, index) => <RadioItem ref={(node) => { itemRefs.current[index] = node; }} key={option.value} option={option} testID={testID ? `${testID}-${option.value}` : `${fieldId}-${option.value}`} selected={option.value === value} disabled={disabled || Boolean(option.disabled)} tabIndex={index === tabStopIndex ? 0 as const : -1 as const} onKeyDown={(event) => navigate(index, event)} onPress={() => onChange(option.value)} onBlur={onBlur} />)}
        </VStack>
      </View>
    </FormField>
  );
}
const RadioItem = forwardRef<ComponentRef<typeof Pressable>, { option: RadioOption; testID?: string; selected: boolean; disabled: boolean; tabIndex: 0 | -1; onKeyDown: (event: { key: string; preventDefault: () => void }) => void; onPress: () => void; onBlur?: (() => void) | undefined }>(function RadioItem({ option, testID, selected, disabled, tabIndex, onKeyDown, onPress, onBlur }, ref) {
  const { hovered, focused, interactionProps } = useInteractionState();
  const keyboardProps = Platform.OS === 'web' ? { onKeyDown } : {};
  return (
    <Pressable
      ref={ref}
      accessibilityRole="radio"
      role="radio"
      accessibilityLabel={option.label}
      aria-label={option.label}
      accessibilityState={{ checked: selected, disabled }}
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      testID={testID}
      tabIndex={tabIndex}
      onPress={onPress}
      {...keyboardProps}
      {...interactionProps}
      onBlur={() => { interactionProps.onBlur(); onBlur?.(); }}
      style={({ pressed }) => [styles.selectionRow, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <VStack gap="xs"><Text variant="label">{option.label}</Text>{option.description ? <Text variant="caption" tone="secondary">{option.description}</Text> : null}</VStack>
    </Pressable>
  );
});

export interface SwitchFieldProps { id?: string; label: string; value: boolean; onChange: (value: boolean) => void; description?: string | undefined; error?: string | undefined; required?: boolean; disabled?: boolean; testID?: string; onBlur?: () => void; }
export function SwitchField({ id, label, value, onChange, description, error, required = false, disabled = false, testID, onBlur }: SwitchFieldProps) {
  const { theme } = useUnistyles();
  const fieldId = id ?? `switch-${label.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`;
  return (
    <FormField label={label} fieldId={fieldId} required={required} description={description} error={error}>
      <View style={[styles.switchRow, disabled && styles.disabled]} testID={testID}>
        <Switch
          accessibilityLabel={label}
          accessibilityHint={[required ? 'Required' : null, error ? `Error: ${error}` : description].filter(Boolean).join('. ') || undefined}
          accessibilityState={{ disabled, checked: value }}
          disabled={disabled}
          value={value}
          onValueChange={onChange}
          onBlur={onBlur}
          trackColor={{ false: theme.colors.border.strong, true: theme.colors.interactive.primary }}
          thumbColor={theme.colors.white}
        />
      </View>
    </FormField>
  );
}

export interface CheckboxGroupProps { id: string; label: string; values: readonly string[]; options: readonly RadioOption[]; onChange: (values: readonly string[]) => void; description?: string | undefined; error?: string | undefined; required?: boolean; disabled?: boolean; testID?: string; }
/** Semantic multiple selection; use a form array for repeatable content rather than using this as a record editor. */
export function CheckboxGroup({ id, label, values, options, onChange, description, error, required = false, disabled = false, testID }: CheckboxGroupProps) {
  const selected = new Set(values);
  const toggle = (option: RadioOption, checked: boolean) => onChange(checked ? [...values, option.value] : values.filter((value) => value !== option.value));
  return (
    <FormField label={label} fieldId={id} required={required} description={description} error={error}>
      <View role="group" accessibilityLabel={label} aria-label={label} aria-required={required} aria-invalid={Boolean(error)} testID={testID}>
        <VStack gap="sm">
          {options.map((option) => <Checkbox key={option.value} id={`${id}-${option.value}`} testID={`${id}-${option.value}`} label={option.label} checked={selected.has(option.value)} onChange={(checked) => toggle(option, checked)} description={option.description} disabled={disabled || Boolean(option.disabled)} />)}
        </VStack>
      </View>
    </FormField>
  );
}

export interface SegmentedFieldProps { id: string; label: string; value: string; options: readonly SegmentedControlOption[]; onChange: (value: string) => void; description?: string | undefined; error?: string | undefined; required?: boolean; disabled?: boolean; testID?: string; }
export function SegmentedField({ id, label, value, options, onChange, description, error, required = false, disabled = false, testID }: SegmentedFieldProps) {
  return <FormField label={label} fieldId={id} required={required} description={description} error={error}><SegmentedControl label={label} value={value} options={options} onChange={onChange} disabled={disabled} invalid={Boolean(error)} testID={testID} /></FormField>;
}

const styles = StyleSheet.create((theme) => ({
  selectionRow: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderRadius: theme.radii.sm, paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  hovered: { backgroundColor: theme.colors.background.subtle },
  focused: { boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  check: { width: theme.formMetrics.checkboxSize, height: theme.formMetrics.checkboxSize, borderRadius: theme.radii.xs, borderWidth: theme.strokeWidths.emphasis, borderColor: theme.colors.border.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.surface },
  checkOn: { backgroundColor: theme.colors.interactive.primary, borderColor: theme.colors.interactive.primary },
  radio: { width: theme.formMetrics.checkboxSize, height: theme.formMetrics.checkboxSize, borderRadius: theme.radii.full, borderWidth: theme.strokeWidths.emphasis, borderColor: theme.colors.border.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.surface },
  radioOn: { borderColor: theme.colors.interactive.primary },
  radioDot: { width: theme.formMetrics.radioDotSize, height: theme.formMetrics.radioDotSize, borderRadius: theme.radii.full, backgroundColor: theme.colors.interactive.primary },
  switchRow: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.lg },
}));
