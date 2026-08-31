import type { Control, FieldPath, FieldValues, RegisterOptions, UseFormProps } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { Checkbox, PasswordField, TextField, type CheckboxProps, type TextFieldProps } from '@precision-calm/forms';

export function usePrecisionForm<TFieldValues extends FieldValues>(options?: UseFormProps<TFieldValues>) {
  return useForm<TFieldValues>({ mode: 'onBlur', reValidateMode: 'onChange', shouldFocusError: true, ...options });
}

type ControlledTextFieldProps<T extends FieldValues, TName extends FieldPath<T>> = {
  control: Control<T>;
  name: TName;
  rules?: RegisterOptions<T, TName>;
} & Omit<TextFieldProps, 'value' | 'onChangeText' | 'error'>;

export function ControlledTextField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledTextFieldProps<T, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={field.ref}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}

export function ControlledPasswordField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledTextFieldProps<T, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <PasswordField
          {...props}
          ref={field.ref}
          value={String(field.value ?? '')}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}

type ControlledCheckboxProps<T extends FieldValues, TName extends FieldPath<T>> = {
  control: Control<T>;
  name: TName;
  rules?: RegisterOptions<T, TName>;
} & Omit<CheckboxProps, 'checked' | 'onChange' | 'error'>;

export function ControlledCheckbox<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledCheckboxProps<T, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <Checkbox
          {...props}
          checked={Boolean(field.value)}
          onChange={field.onChange}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}
