import { useEffect, useId, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { usePrecisionI18n } from '@precision-calm/i18n';
import { Popover } from '@precision-calm/overlays';
import { resolveRovingFocusIndex } from '@precision-calm/platform';
import { Text, VStack, useInteractionState } from '@precision-calm/primitives';
import { FormField } from './FormField';
import type { SelectOption } from './SelectField';
import { OptionItem, OptionList } from './OptionList';

interface ChoiceFieldBaseProps {
  id: string;
  label: string;
  options: readonly SelectOption[];
  placeholder?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  query?: string | undefined;
  onQueryChange?: ((query: string) => void) | undefined;
  loading?: boolean;
  optionsError?: string | undefined;
  onRetryOptions?: (() => void) | undefined;
  emptyMessage?: string | undefined;
  testID?: string | undefined;
}

export interface ComboboxFieldProps extends ChoiceFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
}

/** Searchable single selection with product-owned option loading and query state. */
export function ComboboxField({ value, onChange, ...props }: ComboboxFieldProps) {
  return <ChoiceField {...props} selectedValues={value ? [value] : []} onSelectedValuesChange={(values) => onChange(values[0] ?? '')} multiple={false} />;
}

export interface MultiSelectFieldProps extends ChoiceFieldBaseProps {
  values: readonly string[];
  onChange: (values: readonly string[]) => void;
}

/** Searchable finite multi-selection; use a domain search workflow for an unbounded entity picker. */
export function MultiSelectField({ values, onChange, ...props }: MultiSelectFieldProps) {
  return <ChoiceField {...props} selectedValues={values} onSelectedValuesChange={onChange} multiple />;
}

function ChoiceField({
  id,
  label,
  options,
  selectedValues,
  onSelectedValuesChange,
  multiple,
  placeholder = 'Select an option',
  description,
  error,
  required = false,
  disabled = false,
  query: controlledQuery,
  onQueryChange,
  loading = false,
  optionsError,
  onRetryOptions,
  emptyMessage = 'No options match this search.',
  testID,
}: ChoiceFieldBaseProps & { selectedValues: readonly string[]; onSelectedValuesChange: (values: readonly string[]) => void; multiple: boolean }) {
  const [open, setOpen] = useState(false);
  const [internalQuery, setInternalQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const instanceId = useId().replaceAll(':', '');
  const { theme } = useUnistyles();
  const { locale } = usePrecisionI18n();
  const { hovered, focused, interactionProps } = useInteractionState();
  const query = controlledQuery ?? internalQuery;
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selected = useMemo(() => options.filter((option) => selectedSet.has(option.value)), [options, selectedSet]);
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return options.filter((option) => !normalized || option.label.toLocaleLowerCase(locale).includes(normalized));
  }, [locale, options, query]);
  const enabledOptions = visibleOptions.map((option) => !option.disabled);
  const listboxId = `${id}-${instanceId}-listbox`;
  const activeOption = visibleOptions[activeIndex];
  const activeOptionId = activeOption ? `${id}-${instanceId}-option-${activeIndex}` : undefined;
  const messageId = error || description ? `${id}-message` : undefined;
  const updateQuery = (next: string) => { if (controlledQuery === undefined) setInternalQuery(next); onQueryChange?.(next); };
  const select = (option: SelectOption) => {
    if (option.disabled) return;
    const next = multiple
      ? selectedSet.has(option.value) ? selectedValues.filter((item) => item !== option.value) : [...selectedValues, option.value]
      : [option.value];
    onSelectedValuesChange(next);
    if (!multiple) setOpen(false);
  };
  const keyboardSelect = () => { if (activeOption) select(activeOption); };
  const anchorLabel = selected.length === 0 ? placeholder : multiple ? `${selected.length} selected: ${selected.map((option) => option.label).join(', ')}` : selected[0]?.label ?? placeholder;

  useEffect(() => {
    if (enabledOptions[activeIndex]) return;
    setActiveIndex(Math.max(0, enabledOptions.findIndex(Boolean)));
  }, [activeIndex, enabledOptions]);

  useEffect(() => {
    if (!open || !activeOptionId || Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
  }, [activeOptionId, open]);

  useEffect(() => {
    if (!open) return;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.getElementById(`${id}-${instanceId}-input`)?.focus();
      return;
    }
    inputRef.current?.focus();
  }, [id, instanceId, open]);

  return (
    <FormField label={label} fieldId={id} required={required} description={description} error={error}>
      <Popover open={open} onOpenChange={setOpen} accessibilityLabel={`${label} options`} matchAnchorWidth restoreFocusId={`${id}-trigger`} anchor={(
        <Pressable
          nativeID={`${id}-trigger`}
          accessibilityRole="combobox"
          role="combobox"
          accessibilityLabel={label}
          accessibilityState={{ disabled, expanded: open }}
          aria-label={label}
          aria-expanded={open}
          {...(Platform.OS === 'web' ? { 'aria-controls': open ? listboxId : undefined, 'aria-hidden': open } : {})}
          accessibilityElementsHidden={open}
          tabIndex={open ? -1 : 0}
          aria-disabled={disabled}
          {...(Platform.OS === 'web' ? { 'aria-describedby': messageId, 'aria-errormessage': error ? messageId : undefined, 'aria-invalid': Boolean(error), 'aria-required': required } : {})}
          disabled={disabled}
          onPress={() => setOpen((current) => !current)}
          {...interactionProps}
          testID={testID}
          style={({ pressed }) => [styles.anchor, hovered && !disabled && styles.hovered, focused && styles.focused, Boolean(error) && styles.error, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
        >
          <Text tone={selected.length ? 'primary' : 'tertiary'} numberOfLines={2}>{anchorLabel}</Text><View style={styles.spacer} /><Icon name="chevronDown" size="sm" tone="secondary" />
        </Pressable>
      )}>
        <OptionList id={listboxId} label={`${label} results`} multiple={multiple} testID={testID ? `${testID}-options` : undefined}>
          <View style={styles.searchShell}>
            <Icon name="search" size="sm" tone="secondary" />
            <TextInput
              ref={inputRef}
              nativeID={`${id}-${instanceId}-input`}
              accessibilityRole="combobox"
              role="combobox"
              accessibilityLabel={`Search ${label}`}
              aria-label={`Search ${label}`}
              accessibilityState={{ expanded: open }}
              aria-expanded={open}
              {...(Platform.OS === 'web' ? { 'aria-controls': listboxId, 'aria-activedescendant': activeOptionId, 'aria-autocomplete': 'list' } : {})}
              autoFocus={open}
              value={query}
              onChangeText={updateQuery}
              onKeyPress={(event) => {
                const key = event.nativeEvent.key;
                const next = resolveRovingFocusIndex(key, activeIndex, enabledOptions, { orientation: 'vertical' });
                if (next !== null) {
                  event.preventDefault();
                  setActiveIndex(next);
                } else if (key === 'Enter') {
                  event.preventDefault();
                  keyboardSelect();
                } else if (key === 'Escape') {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
              placeholder="Search options"
              placeholderTextColor={theme.colors.text.tertiary}
              inputMode="search"
              returnKeyType="search"
              maxFontSizeMultiplier={2}
              style={styles.searchInput}
            />
          </View>
          {loading ? <ChoiceStatus message="Loading options…" busy /> : null}
          {optionsError ? <ChoiceStatus message={optionsError} onRetry={onRetryOptions} /> : null}
          {!loading && !optionsError && visibleOptions.length === 0 ? <ChoiceStatus message={emptyMessage} /> : null}
          {!loading && !optionsError ? visibleOptions.map((option, index) => (
            <OptionItem
              id={`${id}-${instanceId}-option-${index}`}
              key={option.value}
              label={option.label}
              disabled={Boolean(option.disabled)}
              selected={selectedSet.has(option.value)}
              active={index === activeIndex}
              trailing={selectedSet.has(option.value) ? <Icon name="check" size="sm" tone="accent" /> : index === activeIndex ? <Text variant="micro" tone="secondary">Active</Text> : null}
              onPress={() => select(option)}
            />
          )) : null}
        </OptionList>
      </Popover>
    </FormField>
  );
}

function ChoiceStatus({ message, busy = false, onRetry }: { message: string; busy?: boolean; onRetry?: (() => void) | undefined }) {
  return <VStack gap="xs"><View accessibilityLiveRegion="polite" aria-live="polite"><Text variant="caption" tone="secondary">{busy ? `${message} Please wait.` : message}</Text></View>{onRetry ? <Pressable accessibilityRole="button" role="button" accessibilityLabel="Retry options" onPress={onRetry}><Text variant="label" tone="accent">Retry</Text></Pressable> : null}</VStack>;
}

const styles = StyleSheet.create((theme) => ({
  anchor: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.formMetrics.inputHorizontalPadding, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.sm, backgroundColor: theme.colors.background.surface },
  spacer: { flex: 1 },
  hovered: { backgroundColor: theme.colors.background.subtle },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  error: { borderColor: theme.colors.feedback.negative },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity, backgroundColor: theme.colors.background.subtle },
  searchShell: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, borderBottomWidth: theme.strokeWidths.standard, borderBottomColor: theme.colors.border.subtle },
  searchInput: { minWidth: 0, flex: 1, minHeight: theme.controlHeights.md, color: theme.colors.text.primary, ...theme.typography.body },
}));
