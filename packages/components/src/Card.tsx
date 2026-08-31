import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useDensity } from '@precision-calm/primitives';

export function Card({ children }: PropsWithChildren) {
  const density = useDensity();
  return <View style={[styles.card, density === 'compact' && styles.compact]}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    minWidth: 0,
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.default,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: { compact: theme.spacing.lg, expanded: theme.spacing.xl },
  },
  compact: { padding: { compact: theme.spacing.md, expanded: theme.spacing.lg } },
}));
