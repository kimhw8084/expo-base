import { forwardRef, useState } from 'react';
import { TextInput } from 'react-native';
import { TextField, type TextFieldProps } from './TextField';

type SpecializedProps = Omit<TextFieldProps, 'secureTextEntry' | 'iconEnd' | 'onIconEndPress' | 'iconEndLabel'>;

export const PasswordField = forwardRef<TextInput, SpecializedProps>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return <TextField ref={ref} {...props} autoComplete={props.autoComplete ?? 'current-password'} textContentType={props.textContentType ?? 'password'} secureTextEntry={!visible} iconStart={props.iconStart ?? 'lock'} iconEnd={visible ? 'eyeOff' : 'eye'} iconEndLabel={visible ? 'Hide password' : 'Show password'} onIconEndPress={() => setVisible((value) => !value)} />;
});

export const SearchField = forwardRef<TextInput, Omit<TextFieldProps, 'inputMode' | 'returnKeyType'>>(function SearchField(props, ref) {
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'search'} inputMode="search" returnKeyType="search" />;
});

export const CurrencyField = forwardRef<TextInput, Omit<TextFieldProps, 'inputMode' | 'keyboardType'>>(function CurrencyField(props, ref) {
  return <TextField ref={ref} {...props} iconStart={props.iconStart ?? 'circleDollar'} inputMode="decimal" keyboardType="decimal-pad" />;
});
