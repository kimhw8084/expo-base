import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import { Icon } from '@precision-calm/icons';

export interface FormFieldProps extends PropsWithChildren {
  label: string;
  fieldId: string;
  required?: boolean;
  description?: ReactNode;
  error?: string | undefined;
}

export function FormField({ label, fieldId, required = false, description, error, children }: FormFieldProps) {
  return (
    <VStack gap="sm">
      <View style={styles.labelRow}>
        <Text variant="label">{label}</Text>
        {required ? <Text variant="micro" tone="secondary">Required</Text> : null}
      </View>
      {children}
      {error ? (
        <View style={styles.messageRow}>
          <Icon name="warning" size="xs" tone="negative" />
          <Text variant="caption" tone="negative" testID={`${fieldId}-error`}>{error}</Text>
        </View>
      ) : description ? <Text variant="caption" tone="secondary">{description}</Text> : null}
    </VStack>
  );
}

const styles = StyleSheet.create((theme) => ({
  labelRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  messageRow: { minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.xs },
}));
