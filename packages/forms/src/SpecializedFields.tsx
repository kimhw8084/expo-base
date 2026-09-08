import { forwardRef, useState } from 'react';
import { TextInput } from 'react-native';
import { formatPrecisionEditableNumber, parsePrecisionDecimalInput, usePrecisionI18n } from '@precision-calm/i18n';
import { TextField, type TextFieldProps } from './TextField';

type SpecializedProps = Omit<TextFieldProps, 'secureTextEntry' | 'iconEnd' | 'onIconEndPress' | 'iconEndLabel'>;

export const PasswordField = forwardRef<TextInput, SpecializedProps>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return <TextField ref={ref} {...props} autoComplete={props.autoComplete ?? 'current-password'} textContentType={props.textContentType ?? 'password'} secureTextEntry={!visible} iconStart={props.iconStart ?? 'lock'} iconEnd={visible ? 'eyeOff' : 'eye'} iconEndLabel={visible ? 'Hide password' : 'Show password'} onIconEndPress={() => setVisible((value) => !value)} />;
});

export const SearchField = forwardRef<TextInput, Omit<TextFieldProps, 'inputMode' | 'returnKeyType'>>(function SearchField(props, ref) {
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'search'} inputMode="search" returnKeyType="search" />;
});

export const EmailField = forwardRef<TextInput, Omit<TextFieldProps, 'inputMode' | 'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'textContentType' | 'autoComplete'>>(function EmailField(props, ref) {
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'mail'} inputMode="email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" />;
});

export const UrlField = forwardRef<TextInput, Omit<TextFieldProps, 'inputMode' | 'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'textContentType' | 'autoComplete'>>(function UrlField(props, ref) {
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'externalLink'} inputMode="url" keyboardType="url" autoCapitalize="none" autoCorrect={false} textContentType="URL" autoComplete="url" />;
});

export const PhoneField = forwardRef<TextInput, Omit<TextFieldProps, 'inputMode' | 'keyboardType' | 'textContentType' | 'autoComplete'>>(function PhoneField(props, ref) {
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'phone'} inputMode="tel" keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" />;
});

export interface NumberFieldProps extends Omit<TextFieldProps, 'inputMode' | 'keyboardType' | 'onBlur'> {
  locale?: string | undefined;
  onValueChange?: ((value: number | null) => void) | undefined;
  formatOnBlur?: boolean;
  minimumFractionDigits?: number | undefined;
  maximumFractionDigits?: number | undefined;
  onBlur?: TextFieldProps['onBlur'];
}

/** Keeps an editable string under product control while exposing a locale-aware committed numeric value. */
export const NumberField = forwardRef<TextInput, NumberFieldProps>(function NumberField({ locale: localeOverride, onValueChange, formatOnBlur = false, minimumFractionDigits, maximumFractionDigits, onChangeText, onBlur, ...props }, ref) {
  const { locale } = usePrecisionI18n();
  const resolvedLocale = localeOverride ?? locale;
  const change = (next: string) => {
    onChangeText(next);
    onValueChange?.(parsePrecisionDecimalInput(next, resolvedLocale));
  };
  const blur: NonNullable<TextFieldProps['onBlur']> = (event) => {
    if (formatOnBlur) {
      const parsed = parsePrecisionDecimalInput(props.value, resolvedLocale);
      if (parsed !== null) onChangeText(formatPrecisionEditableNumber(parsed, resolvedLocale, { minimumFractionDigits, maximumFractionDigits }));
    }
    onBlur?.(event);
  };
  return <TextField ref={ref} {...props} inputMode="decimal" keyboardType="decimal-pad" onChangeText={change} onBlur={blur} />;
});

export interface CurrencyFieldProps extends Omit<NumberFieldProps, 'minimumFractionDigits' | 'maximumFractionDigits'> {
  currency?: string;
}

/** A locale-aware editable currency field. It formats only after blur, never while a user is typing. */
export const CurrencyField = forwardRef<TextInput, CurrencyFieldProps>(function CurrencyField({ currency = 'USD', formatOnBlur = true, locale: localeOverride, onValueChange, onChangeText, onBlur, ...props }, ref) {
  const { locale } = usePrecisionI18n();
  const resolvedLocale = localeOverride ?? locale;
  const change = (next: string) => {
    onChangeText(next);
    onValueChange?.(parsePrecisionDecimalInput(next, resolvedLocale));
  };
  const blur: NonNullable<TextFieldProps['onBlur']> = (event) => {
    if (formatOnBlur) {
      const parsed = parsePrecisionDecimalInput(props.value, resolvedLocale);
      if (parsed !== null) onChangeText(formatPrecisionEditableNumber(parsed, resolvedLocale, { style: 'currency', currency }));
    }
    onBlur?.(event);
  };
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'circleDollar'} inputMode="decimal" keyboardType="decimal-pad" onChangeText={change} onBlur={blur} />;
});
