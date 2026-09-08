import { forwardRef, useState } from 'react';
import { Platform, TextInput, type TextInputProps, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { IconButton } from '@precision-calm/components';
import { FormField } from './FormField';

type AllowedTextInputProps = Pick<TextInputProps,
  | 'autoCapitalize' | 'autoComplete' | 'autoCorrect' | 'autoFocus' | 'inputMode'
  | 'keyboardType' | 'returnKeyType' | 'submitBehavior' | 'textContentType'
  | 'onSubmitEditing' | 'onFocus' | 'onBlur' | 'onKeyPress' | 'maxLength' | 'selectTextOnFocus'>;

export interface TextFieldProps extends AllowedTextInputProps {
  id: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  onIconEndPress?: () => void;
  iconEndLabel?: string;
  secureTextEntry?: boolean;
  testID?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({
  id, label, value, onChangeText, placeholder, description, error, required = false, disabled = false, readOnly = false,
  iconStart, iconEnd, onIconEndPress, iconEndLabel, secureTextEntry, testID, onFocus, onBlur, ...inputProps
}, ref) {
  const [focused, setFocused] = useState(false);
  const { theme } = useUnistyles();
  const messageId = error || description ? `${id}-message` : undefined;
  const accessibilityHint = [required ? 'Required' : null, error ? `Error: ${error}` : description].filter(Boolean).join('. ') || undefined;
  const webAccessibilityProps = Platform.OS === 'web' ? {
    'aria-describedby': messageId,
    'aria-errormessage': error ? messageId : undefined,
    'aria-invalid': Boolean(error),
    'aria-required': required,
  } : {};
  return (
    <FormField label={label} fieldId={id} required={required} description={description} error={error}>
      <View style={[styles.shell, focused && styles.focused, Boolean(error) && styles.error, disabled && styles.disabled]}>
        {iconStart ? <Icon name={iconStart} size="sm" tone="secondary" /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          {...webAccessibilityProps}
          readOnly={Platform.OS === 'web' ? disabled || readOnly : undefined}
          editable={Platform.OS === 'web' ? undefined : !disabled && !readOnly}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          maxFontSizeMultiplier={2}
          testID={testID ?? id}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={styles.input}
          {...inputProps}
        />
        {iconEnd ? (
          onIconEndPress
            ? <IconButton icon={iconEnd} label={iconEndLabel ?? `${label} action`} size="sm" variant="ghost" onPress={onIconEndPress} />
            : <Icon name={iconEnd} size="sm" tone="secondary" />
        ) : null}
      </View>
    </FormField>
  );
});

const styles = StyleSheet.create((theme) => ({
  shell: {
    minWidth: 0,
    minHeight: theme.controlHeights.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingStart: theme.formMetrics.inputHorizontalPadding,
    paddingEnd: theme.spacing.xs,
    borderWidth: theme.strokeWidths.standard,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background.surface,
  },
  input: { flex: 1, minWidth: 0, minHeight: theme.controlHeights.md, color: theme.colors.text.primary, ...theme.typography.body, paddingVertical: 0 },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.interactive.subtle}` },
  error: { borderColor: theme.colors.feedback.negative },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity, backgroundColor: theme.colors.background.subtle },
}));
