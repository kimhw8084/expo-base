import { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { usePrecisionI18n } from '@precision-calm/i18n';
import {
  formatPrecisionCalendarDate,
  formatPrecisionTimeValue,
  parsePrecisionDateRange,
  parsePrecisionDateValue,
  parsePrecisionTimeValue,
  type PrecisionDateRangeValue,
  type PrecisionDateValue,
  type PrecisionTimeValue,
} from '@precision-calm/platform';
import { FormField } from './FormField';
import { TextField, type TextFieldProps } from './TextField';

type DateTimeBaseProps = Omit<TextFieldProps, 'autoCapitalize' | 'autoCorrect' | 'iconStart'> & { locale?: string };

export interface DateFieldProps extends DateTimeBaseProps {
  min?: PrecisionDateValue;
  max?: PrecisionDateValue;
  onValueChange?: ((value: PrecisionDateValue | null) => void) | undefined;
}

/** Portable calendar-date field. The transport value is YYYY-MM-DD and never receives timezone coercion. */
export const DateField = forwardRef<TextInput, DateFieldProps>(function DateField({ locale: localeOverride, min, max, onValueChange, onChangeText, description, ...props }, ref) {
  const { locale } = usePrecisionI18n();
  const parsed = parsePrecisionDateValue(props.value);
  const hint = parsed ? formatPrecisionCalendarDate(parsed, localeOverride ?? locale) : 'Use YYYY-MM-DD';
  return <TextField ref={ref} {...props} description={description ?? hint} placeholder={props.placeholder ?? 'YYYY-MM-DD'} autoCapitalize="none" autoCorrect={false} iconStart="calendar" onChangeText={(next) => { onChangeText(next); const nextParsed = parsePrecisionDateValue(next); onValueChange?.(nextParsed && (!min || nextParsed >= min) && (!max || nextParsed <= max) ? nextParsed : null); }} />;
});

export interface TimeFieldProps extends DateTimeBaseProps {
  min?: PrecisionTimeValue;
  max?: PrecisionTimeValue;
  onValueChange?: ((value: PrecisionTimeValue | null) => void) | undefined;
}

/** Portable wall-clock field. HH:mm is explicit and independent of date or timezone. */
export const TimeField = forwardRef<TextInput, TimeFieldProps>(function TimeField({ locale: localeOverride, min, max, onValueChange, onChangeText, description, ...props }, ref) {
  const { locale } = usePrecisionI18n();
  const parsed = parsePrecisionTimeValue(props.value);
  const hint = parsed ? formatPrecisionTimeValue(parsed, localeOverride ?? locale) : 'Use 24-hour HH:mm';
  return <TextField ref={ref} {...props} description={description ?? hint} placeholder={props.placeholder ?? 'HH:mm'} autoCapitalize="none" autoCorrect={false} iconStart="clock" onChangeText={(next) => { onChangeText(next); const nextParsed = parsePrecisionTimeValue(next); onValueChange?.(nextParsed && (!min || nextParsed >= min) && (!max || nextParsed <= max) ? nextParsed : null); }} />;
});

export interface DateRangeFieldProps {
  id: string;
  label: string;
  start: string;
  end: string;
  onChange: (value: { start: string; end: string }) => void;
  onValueChange?: ((value: PrecisionDateRangeValue | null) => void) | undefined;
  startLabel?: string;
  endLabel?: string;
  min?: PrecisionDateValue;
  max?: PrecisionDateValue;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  locale?: string;
  testID?: string;
}

/** Composes two portable calendar fields while owning range order and grouped error semantics. */
export function DateRangeField({ id, label, start, end, onChange, onValueChange, startLabel = 'Start date', endLabel = 'End date', min, max, description, error, required = false, disabled = false, locale, testID }: DateRangeFieldProps) {
  const emit = (next: { start: string; end: string }) => {
    onChange(next);
    const parsed = parsePrecisionDateRange(next.start, next.end);
    const withinBounds = parsed && (!min || parsed.start >= min) && (!max || parsed.end <= max);
    onValueChange?.(withinBounds ? parsed : null);
  };
  return (
    <FormField label={label} fieldId={id} required={required} description={description} error={error}>
      <View role="group" accessibilityLabel={label} style={styles.range} testID={testID}>
        <View style={styles.field}><DateField id={`${id}-start`} label={startLabel} value={start} onChangeText={(value) => emit({ start: value, end })} {...(min ? { min } : {})} {...(max ? { max } : {})} required={required} disabled={disabled} {...(locale ? { locale } : {})} /></View>
        <View style={styles.field}><DateField id={`${id}-end`} label={endLabel} value={end} onChangeText={(value) => emit({ start, end: value })} {...(min ?? start ? { min: min ?? start } : {})} {...(max ? { max } : {})} required={required} disabled={disabled} {...(locale ? { locale } : {})} /></View>
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create((theme) => ({
  range: { minWidth: 0, flexDirection: { compact: 'column', medium: 'row' }, gap: theme.spacing.md },
  field: { minWidth: 0, flex: 1 },
}));
