import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { IconButton } from '@precision-calm/components';
import { Text } from '@precision-calm/primitives';
import { FormField } from './FormField';

export interface NumberStepperProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  minimum?: number | undefined;
  maximum?: number | undefined;
  description?: string | undefined;
  error?: string | undefined;
  disabled?: boolean;
  formatValue?: ((value: number) => string) | undefined;
  testID?: string | undefined;
}

/** A bounded, touch-safe numerical adjustment. Use NumberField for free-form decimal entry. */
export function NumberStepper({ id, label, value, onChange, step = 1, minimum, maximum, description, error, disabled = false, formatValue = String, testID }: NumberStepperProps) {
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const decrement = () => onChange(clamp(value - safeStep, minimum, maximum));
  const increment = () => onChange(clamp(value + safeStep, minimum, maximum));
  const atMinimum = minimum !== undefined && value <= minimum;
  const atMaximum = maximum !== undefined && value >= maximum;
  return (
    <FormField label={label} fieldId={id} description={description} error={error}>
      <View accessibilityRole="adjustable" role="spinbutton" accessibilityLabel={label} accessibilityValue={{ min: minimum, max: maximum, now: value, text: formatValue(value) }} aria-valuemin={minimum} aria-valuemax={maximum} aria-valuenow={value} style={styles.row} testID={testID}>
        <IconButton icon="minus" label={`Decrease ${label}`} disabled={disabled || atMinimum} onPress={decrement} />
        <Text variant="h3" numeric align="center">{formatValue(value)}</Text>
        <IconButton icon="plus" label={`Increase ${label}`} disabled={disabled || atMaximum} onPress={increment} />
      </View>
    </FormField>
  );
}

function clamp(value: number, minimum?: number, maximum?: number): number {
  return Math.min(maximum ?? Number.POSITIVE_INFINITY, Math.max(minimum ?? Number.NEGATIVE_INFINITY, value));
}

const styles = StyleSheet.create((theme) => ({ row: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.md, padding: theme.spacing.xs, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, backgroundColor: theme.colors.background.surface } }));
