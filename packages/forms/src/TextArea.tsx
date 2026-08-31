import { forwardRef, useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { FormField } from './FormField';

export interface TextAreaProps extends Pick<TextInputProps, 'autoCapitalize' | 'autoCorrect' | 'maxLength'> {
  id: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  testID?: string;
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(function TextArea({ id, label, value, onChangeText, placeholder, description, error, required = false, disabled = false, testID, ...inputProps }, ref) {
  const [focused, setFocused] = useState(false);
  const { theme } = useUnistyles();
  return (
    <FormField label={label} fieldId={id} required={required} description={description} error={error}>
      <View style={[styles.shell, focused && styles.focused, Boolean(error) && styles.error, disabled && styles.disabled]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          editable={!disabled}
          multiline
          textAlignVertical="top"
          submitBehavior="newline"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          testID={testID ?? id}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          {...inputProps}
        />
      </View>
    </FormField>
  );
});

const styles = StyleSheet.create((theme) => ({
  shell: { minWidth: 0, minHeight: theme.formMetrics.textAreaMinHeight, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radii.sm, backgroundColor: theme.colors.background.surface },
  input: { minWidth: 0, minHeight: theme.formMetrics.textAreaMinHeight, color: theme.colors.text.primary, ...theme.typography.body, paddingHorizontal: theme.formMetrics.inputHorizontalPadding, paddingVertical: theme.spacing.md },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.interactive.subtle}` },
  error: { borderColor: theme.colors.feedback.negative },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity, backgroundColor: theme.colors.background.subtle },
}));
