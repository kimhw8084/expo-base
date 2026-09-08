import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '@precision-calm/components';
import type { IconName } from '@precision-calm/icons';
import { Text, VStack } from '@precision-calm/primitives';

export interface SelectionBarAction {
  key: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName | undefined;
  disabled?: boolean | undefined;
}

export interface SelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions?: readonly SelectionBarAction[];
  description?: string | undefined;
  accessibilityLabel?: string | undefined;
  testID?: string | undefined;
  trailing?: ReactNode;
}

export function SelectionBar({
  selectedCount,
  onClear,
  actions = [],
  description,
  accessibilityLabel = 'Bulk actions',
  testID,
  trailing,
}: SelectionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <View
      accessibilityRole="toolbar"
      role="toolbar"
      accessibilityLabel={accessibilityLabel}
      aria-label={accessibilityLabel}
      style={styles.root}
      testID={testID}
    >
      <View style={styles.summary} accessibilityLiveRegion="polite">
        <VStack gap="xs">
          <Text variant="label" numeric>{selectedCount} selected</Text>
          {description ? <Text variant="caption" tone="secondary">{description}</Text> : null}
        </VStack>
      </View>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Button
            key={action.key}
            label={action.label}
            size="sm"
            variant={action.variant ?? 'secondary'}
            {...(action.icon !== undefined ? { iconStart: action.icon } : {})}
            disabled={Boolean(action.disabled)}
            responsiveWidth="compact-full"
            onPress={action.onPress}
          />
        ))}
        {trailing}
        <Button label="Clear selection" size="sm" variant="ghost" responsiveWidth="compact-full" onPress={onClear} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    minWidth: 0,
    flexDirection: { compact: 'column', medium: 'row' },
    alignItems: { compact: 'stretch', medium: 'center' },
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: theme.strokeWidths.standard,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.interactive.subtle,
  },
  summary: { minWidth: 0, flex: 1 },
  actions: {
    minWidth: 0,
    flexDirection: { compact: 'column', medium: 'row' },
    alignItems: { compact: 'stretch', medium: 'center' },
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
}));
