import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export interface FormSectionProps extends PropsWithChildren { title?: string; description?: string; }
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <VStack gap="lg">
      {title || description ? <VStack gap="xs">{title ? <Text variant="h3">{title}</Text> : null}{description ? <Text tone="secondary">{description}</Text> : null}</VStack> : null}
      <VStack gap="lg">{children}</VStack>
    </VStack>
  );
}

export interface FormActionsProps { primary: ReactNode; secondary?: ReactNode; }
export function FormActions({ primary, secondary }: FormActionsProps) {
  return <View style={styles.actions}>{secondary}{primary}</View>;
}

const styles = StyleSheet.create((theme) => ({
  actions: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: theme.spacing.sm, paddingTop: theme.spacing.sm },
}));
