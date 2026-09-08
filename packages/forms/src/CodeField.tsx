import { createRef, useMemo, type RefObject } from 'react';
import { TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { FormField } from './FormField';

export interface CodeFieldProps {
  id: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  description?: string | undefined;
  error?: string | undefined;
  disabled?: boolean;
  secure?: boolean;
  onBlur?: (() => void) | undefined;
  testID?: string | undefined;
}

/** Provider-neutral one-time-code/PIN entry with paste, sequential focus, and error semantics. */
export function CodeField({ id, label, value, onChangeText, length = 6, description, error, disabled = false, secure = false, onBlur, testID }: CodeFieldProps) {
  const { theme } = useUnistyles();
  const count = Math.max(4, Math.min(8, Math.trunc(length)));
  const refs = useMemo(() => Array.from({ length: count }, () => createRef<TextInput>()), [count]);
  const digits = normalizeCode(value).slice(0, count);
  const setAt = (index: number, input: string) => {
    const entered = normalizeCode(input);
    const next = `${digits.slice(0, index)}${entered}${digits.slice(index + Math.max(1, entered.length))}`.slice(0, count);
    onChangeText(next);
    const nextIndex = Math.min(count - 1, index + Math.max(1, entered.length));
    if (entered) refs[nextIndex]?.current?.focus();
  };
  const backspace = (index: number) => {
    if (digits[index]) return;
    const nextIndex = Math.max(0, index - 1);
    onChangeText(`${digits.slice(0, nextIndex)}${digits.slice(index)}`);
    refs[nextIndex]?.current?.focus();
  };
  return (
    <FormField label={label} fieldId={id} description={description} error={error}>
      <View accessibilityLabel={label} style={styles.row} testID={testID}>
        {Array.from({ length: count }, (_, index) => (
          <TextInput
            key={index}
            ref={refs[index] as RefObject<TextInput>}
            accessibilityLabel={`${label}, digit ${index + 1} of ${count}`}
            accessibilityState={{ disabled }}
            editable={!disabled}
            value={digits[index] ?? ''}
            onChangeText={(input) => setAt(index, input)}
            onKeyPress={(event) => { if (event.nativeEvent.key === 'Backspace') backspace(index); }}
            onBlur={onBlur}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            secureTextEntry={secure}
            maxLength={count}
            maxFontSizeMultiplier={2}
            testID={testID ? `${testID}-${index + 1}` : `${id}-${index + 1}`}
            style={[styles.cell, Boolean(error) && styles.error, disabled && styles.disabled, { color: theme.colors.text.primary }]}
          />
        ))}
      </View>
    </FormField>
  );
}

function normalizeCode(value: string): string { return value.replace(/[^0-9]/g, ''); }

const styles = StyleSheet.create((theme) => ({
  row: { minWidth: 0, flexDirection: 'row', gap: theme.spacing.sm },
  cell: { minWidth: 0, flex: 1, minHeight: theme.controlHeights.lg, textAlign: 'center', ...theme.typography.h3, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.sm, backgroundColor: theme.colors.background.surface },
  error: { borderColor: theme.colors.feedback.negative },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity, backgroundColor: theme.colors.background.subtle },
}));
