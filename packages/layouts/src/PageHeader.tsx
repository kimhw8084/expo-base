import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <View style={styles.root}>
      <VStack gap="xs">
        {eyebrow ? <Text variant="micro" tone="secondary">{eyebrow}</Text> : null}
        <Text variant="h1">{title}</Text>
        {description ? <Text tone="secondary">{description}</Text> : null}
      </VStack>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    minWidth: 0,
    flexDirection: { compact: 'column', medium: 'row' },
    alignItems: { compact: 'stretch', medium: 'flex-start' },
    justifyContent: 'space-between',
    gap: { compact: theme.spacing.lg, medium: theme.spacing.xl },
  },
  actions: {
    minWidth: 0,
    flexShrink: 1,
    alignSelf: { compact: 'stretch', medium: 'flex-start' },
  },
}));
