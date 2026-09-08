import { useEffect, useRef, useState } from 'react';
import type { Control, FieldArray, FieldArrayPath, FieldPath, FieldValues, RegisterOptions, UseFormProps, UseFormReturn, SubmitHandler } from 'react-hook-form';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Checkbox, CheckboxGroup, CodeField, ComboboxField, CurrencyField, MultiSelectField, NumberField, NumberStepper, PasswordField, RadioGroup, SegmentedField, SelectField, SwitchField, TextField, useFormLeaveGuard, type CheckboxGroupProps, type CheckboxProps, type CodeFieldProps, type ComboboxFieldProps, type CurrencyFieldProps, type FormErrorSummaryItem, type FormLeaveGuard, type MultiSelectFieldProps, type NumberFieldProps, type NumberStepperProps, type RadioGroupProps, type SegmentedFieldProps, type SelectFieldProps, type SwitchFieldProps, type TextFieldProps } from '@precision-calm/forms';

export function usePrecisionForm<TFieldValues extends FieldValues>(options?: UseFormProps<TFieldValues>) {
  return useForm<TFieldValues>({ mode: 'onBlur', reValidateMode: 'onChange', shouldFocusError: true, ...options });
}

type FormKeyboardSubmitProps = Pick<TextFieldProps, 'returnKeyType' | 'submitBehavior' | 'onSubmitEditing'>;

export function createPrecisionFormKeyboardFlow<TFieldValues extends FieldValues>(form: Pick<UseFormReturn<TFieldValues>, 'setFocus'>) {
  return {
    next(nextField: FieldPath<TFieldValues>): FormKeyboardSubmitProps {
      return {
        returnKeyType: 'next',
        submitBehavior: 'submit',
        onSubmitEditing: () => form.setFocus(nextField),
      };
    },
    done(onDone: () => void | Promise<void>): FormKeyboardSubmitProps {
      return {
        returnKeyType: 'done',
        submitBehavior: 'blurAndSubmit',
        onSubmitEditing: () => { void onDone(); },
      };
    },
  } as const;
}

function hasPrecisionFormError(errors: unknown, field: string): boolean {
  let current: unknown = errors;

  for (const segment of field.split('.')) {
    if (!current || typeof current !== 'object') return false;
    current = (current as Record<string, unknown>)[segment];
  }

  return Boolean(current);
}

export function createPrecisionFormSubmit<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'handleSubmit'>,
  onValid: SubmitHandler<TFieldValues>,
) {
  const submit = form.handleSubmit(onValid);

  return () => {
    void submit();
  };
}

export function usePrecisionFormErrorFocus<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'formState' | 'setFocus'>,
  focusOrder: readonly FieldPath<TFieldValues>[],
) {
  const handledSubmitCount = useRef(0);
  const { errors, isSubmitting, submitCount } = form.formState;

  useEffect(() => {
    if (submitCount === 0) {
      handledSubmitCount.current = 0;
      return;
    }

    if (
      isSubmitting
      || submitCount <= handledSubmitCount.current
    ) {
      return;
    }

    const firstInvalid = focusOrder.find((field) =>
      hasPrecisionFormError(errors, String(field)),
    );

    handledSubmitCount.current = submitCount;

    if (!firstInvalid) {
      return;
    }

    form.setFocus(firstInvalid);
  }, [
    errors,
    focusOrder,
    form,
    isSubmitting,
    submitCount,
  ]);
}

export interface PrecisionFormField<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>;
  label: string;
}

export interface PrecisionFormServerErrors {
  fields?: Readonly<Record<string, string | readonly string[] | undefined>>;
  form?: string | readonly string[] | undefined;
}

export function applyPrecisionFormServerErrors<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'setError'>,
  errors: PrecisionFormServerErrors,
): FieldPath<TFieldValues> | undefined {
  let firstField: FieldPath<TFieldValues> | undefined;
  for (const [name, value] of Object.entries(errors.fields ?? {})) {
    const message = firstErrorMessage(value);
    if (message) {
      const field = name as FieldPath<TFieldValues>;
      firstField ??= field;
      form.setError(field, { type: 'server', message });
    }
  }
  const formMessage = firstErrorMessage(errors.form);
  if (formMessage) form.setError('root.server' as FieldPath<TFieldValues>, { type: 'server', message: formMessage });
  return firstField;
}

export function usePrecisionFormErrorSummary<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'formState' | 'setFocus'>,
  fields: readonly PrecisionFormField<TFieldValues>[],
  showBeforeSubmit = false,
): readonly FormErrorSummaryItem[] {
  const { errors, submitCount } = form.formState;
  if (submitCount === 0 && !showBeforeSubmit) return [];
  const items = fields.flatMap((field) => {
    const message = precisionFormErrorMessage(errors, String(field.name));
    return message ? [{
      id: `form-error-${String(field.name).replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      label: field.label,
      message,
      onPress: () => form.setFocus(field.name),
    }] : [];
  });
  const formMessage = precisionFormErrorMessage(errors, 'root.server');
  return formMessage ? [{ id: 'form-error-root-server', label: 'Form', message: formMessage }, ...items] : items;
}

export interface PrecisionFormLifecycle<TFieldValues extends FieldValues> {
  errors: readonly FormErrorSummaryItem[];
  leaveGuard: FormLeaveGuard;
  applyServerErrors: (errors: PrecisionFormServerErrors) => void;
  reset: () => void;
}

export function usePrecisionFormLifecycle<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'formState' | 'setFocus' | 'setError' | 'reset'>,
  fields: readonly PrecisionFormField<TFieldValues>[],
): PrecisionFormLifecycle<TFieldValues> {
  const [serverErrorsApplied, setServerErrorsApplied] = useState(false);
  usePrecisionFormErrorFocus(form, fields.map((field) => field.name));
  const errors = usePrecisionFormErrorSummary(form, fields, serverErrorsApplied);
  const leaveGuard = useFormLeaveGuard({ isDirty: form.formState.isDirty, onDiscard: () => form.reset() });
  return {
    errors,
    leaveGuard,
    applyServerErrors: (serverErrors) => {
      const firstField = applyPrecisionFormServerErrors(form, serverErrors);
      setServerErrorsApplied(true);
      if (firstField) form.setFocus(firstField);
    },
    reset: () => {
      setServerErrorsApplied(false);
      form.reset();
    },
  };
}

export interface PrecisionFieldArrayOptions<TFieldValues extends FieldValues, TName extends FieldArrayPath<TFieldValues>> {
  control: Control<TFieldValues>;
  name: TName;
  setFocus: (name: FieldPath<TFieldValues>) => void;
}

/**
 * Keeps repeatable RHF content on its supported lifecycle: stable field IDs,
 * focus after append/insert, and a deliberate focus target after removal.
 * Product code owns the row's domain fields and min/max validation.
 */
export function usePrecisionFieldArray<TFieldValues extends FieldValues, TName extends FieldArrayPath<TFieldValues>>({ control, name, setFocus }: PrecisionFieldArrayOptions<TFieldValues, TName>) {
  const fieldArray = useFieldArray<TFieldValues, TName>({ control, name });
  const pendingFocus = useRef<FieldPath<TFieldValues> | null>(null);

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    setFocus(target);
  }, [fieldArray.fields, setFocus]);

  const focusAfterUpdate = (focus?: FieldPath<TFieldValues>) => { if (focus) pendingFocus.current = focus; };
  return {
    ...fieldArray,
    appendItem: (value: FieldArray<TFieldValues, TName>, focus?: FieldPath<TFieldValues>) => {
      focusAfterUpdate(focus);
      fieldArray.append(value, { shouldFocus: !focus });
    },
    insertItem: (index: number, value: FieldArray<TFieldValues, TName>, focus?: FieldPath<TFieldValues>) => {
      focusAfterUpdate(focus);
      fieldArray.insert(index, value, { shouldFocus: !focus });
    },
    removeItem: (index: number, focus?: FieldPath<TFieldValues>) => {
      focusAfterUpdate(focus);
      fieldArray.remove(index);
    },
  };
}

export type PrecisionHiddenFieldPolicy = 'preserve' | 'reset';

/** Code-first conditional-field policy. It deliberately does not invent a rules DSL. */
export function usePrecisionConditionalField<TFieldValues extends FieldValues>(
  form: Pick<UseFormReturn<TFieldValues>, 'resetField'>,
  name: FieldPath<TFieldValues>,
  visible: boolean,
  policy: PrecisionHiddenFieldPolicy = 'preserve',
) {
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (wasVisible.current && !visible && policy === 'reset') form.resetField(name);
    wasVisible.current = visible;
  }, [form, name, policy, visible]);
}

export interface PrecisionAsyncValidatorOptions<TValue> {
  validate: (value: TValue, signal: AbortSignal) => Promise<string | true | undefined>;
  /** Only unexpected transport failures use this message; expected validation remains product-owned. */
  unexpectedErrorMessage?: string;
}

/**
 * Revision-guards field validation and asks transports that support AbortSignal
 * to stop superseded work. It is suitable for RHF `rules.validate`.
 */
export function createPrecisionAsyncValidator<TValue>({ validate, unexpectedErrorMessage = 'Unable to validate this value right now.' }: PrecisionAsyncValidatorOptions<TValue>) {
  let revision = 0;
  let active: AbortController | null = null;
  return async (value: TValue): Promise<string | true> => {
    active?.abort();
    const controller = new AbortController();
    active = controller;
    const requestRevision = ++revision;
    try {
      const outcome = await validate(value, controller.signal);
      if (controller.signal.aborted || requestRevision !== revision) return true;
      return outcome ?? true;
    } catch (error) {
      if (controller.signal.aborted || requestRevision !== revision) return true;
      return error instanceof Error && error.message.trim() ? error.message : unexpectedErrorMessage;
    }
  };
}

export type PrecisionAutosaveState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'error'; error: Error };

export interface PrecisionAutosaveOptions<TValue> {
  value: TValue;
  dirty: boolean;
  enabled?: boolean;
  /** Required rather than arbitrary: the product deliberately chooses its write cadence. */
  delayMs: number;
  save: (value: TValue, signal: AbortSignal) => Promise<void>;
}

/** Product-controlled autosave with explicit cadence, cancellation, stale-save suppression, retry, and no implicit persistence. */
export function usePrecisionAutosave<TValue>({ value, dirty, enabled = true, delayMs, save }: PrecisionAutosaveOptions<TValue>) {
  const [state, setState] = useState<PrecisionAutosaveState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(value);
  latest.current = value;
  const revision = useRef(0);

  useEffect(() => {
    if (!enabled || !dirty) {
      setState({ status: 'idle' });
      return;
    }
    const requestRevision = ++revision.current;
    const controller = new AbortController();
    const wait = Math.max(0, Math.trunc(delayMs));
    setState({ status: 'pending' });
    const timeout = setTimeout(() => {
      setState({ status: 'saving' });
      void save(latest.current, controller.signal).then(
        () => { if (!controller.signal.aborted && requestRevision === revision.current) setState({ status: 'saved' }); },
        (cause: unknown) => {
          if (controller.signal.aborted || requestRevision !== revision.current) return;
          setState({ status: 'error', error: cause instanceof Error ? cause : new Error('Autosave failed.') });
        },
      );
    }, wait);
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [attempt, delayMs, dirty, enabled, save, value]);

  return { state, retry: () => setAttempt((current) => current + 1) } as const;
}

function precisionFormErrorMessage(errors: unknown, field: string): string | undefined {
  let current: unknown = errors;
  for (const segment of field.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (!current || typeof current !== 'object') return undefined;
  const message = (current as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message : undefined;
}

function firstErrorMessage(value: string | readonly string[] | undefined): string | undefined {
  const message = Array.isArray(value) ? value[0] : value;
  return typeof message === 'string' && message.trim() ? message : undefined;
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
      {...(rules ? { rules } : {})}
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
      {...(rules ? { rules } : {})}
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
  const resolvedId = props.id ?? `field-${String(name).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  return (
    <Controller
      control={control}
      name={name}
      {...(rules ? { rules } : {})}
      render={({ field, fieldState }) => (
        <Checkbox
          {...props}
          ref={field.ref}
          id={resolvedId}
          checked={Boolean(field.value)}
          onChange={field.onChange}
          onBlur={field.onBlur}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}

type ControlledSelectFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<SelectFieldProps, 'value' | 'onChange' | 'error'>;
export function ControlledSelectField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledSelectFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <SelectField {...props} value={String(field.value ?? '')} onChange={field.onChange} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledComboboxFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<ComboboxFieldProps, 'value' | 'onChange' | 'error'>;
export function ControlledComboboxField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledComboboxFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <ComboboxField {...props} value={String(field.value ?? '')} onChange={field.onChange} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledMultiSelectFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<MultiSelectFieldProps, 'values' | 'onChange' | 'error'>;
export function ControlledMultiSelectField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledMultiSelectFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <MultiSelectField {...props} values={Array.isArray(field.value) ? field.value.map(String) : []} onChange={field.onChange} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledRadioGroupProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<RadioGroupProps, 'value' | 'onChange' | 'error' | 'onBlur'>;
export function ControlledRadioGroup<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledRadioGroupProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <RadioGroup {...props} value={String(field.value ?? '')} onChange={field.onChange} onBlur={field.onBlur} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledSwitchFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<SwitchFieldProps, 'value' | 'onChange' | 'error' | 'onBlur'>;
export function ControlledSwitchField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledSwitchFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <SwitchField {...props} value={Boolean(field.value)} onChange={field.onChange} onBlur={field.onBlur} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledSegmentedFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<SegmentedFieldProps, 'value' | 'onChange' | 'error'>;
export function ControlledSegmentedField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledSegmentedFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <SegmentedField {...props} value={String(field.value ?? '')} onChange={field.onChange} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledCodeFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<CodeFieldProps, 'value' | 'onChangeText' | 'error'>;
export function ControlledCodeField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledCodeFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <CodeField {...props} value={String(field.value ?? '')} onChangeText={field.onChange} onBlur={field.onBlur} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledNumberFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<NumberFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;
export function ControlledNumberField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledNumberFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <NumberField {...props} value={String(field.value ?? '')} onChangeText={field.onChange} onBlur={field.onBlur} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledCurrencyFieldProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<CurrencyFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;
export function ControlledCurrencyField<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledCurrencyFieldProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <CurrencyField {...props} value={String(field.value ?? '')} onChangeText={field.onChange} onBlur={field.onBlur} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledCheckboxGroupProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<CheckboxGroupProps, 'values' | 'onChange' | 'error'>;
export function ControlledCheckboxGroup<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledCheckboxGroupProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <CheckboxGroup {...props} values={Array.isArray(field.value) ? field.value.map(String) : []} onChange={field.onChange} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}

type ControlledNumberStepperProps<T extends FieldValues, TName extends FieldPath<T>> = { control: Control<T>; name: TName; rules?: RegisterOptions<T, TName>; } & Omit<NumberStepperProps, 'value' | 'onChange' | 'error'>;
export function ControlledNumberStepper<T extends FieldValues, TName extends FieldPath<T>>({ control, name, rules, ...props }: ControlledNumberStepperProps<T, TName>) {
  return <Controller control={control} name={name} {...(rules ? { rules } : {})} render={({ field, fieldState }) => <NumberStepper {...props} value={Number(field.value ?? 0)} onChange={field.onChange} {...(fieldState.error?.message ? { error: fieldState.error.message } : {})} />} />;
}
