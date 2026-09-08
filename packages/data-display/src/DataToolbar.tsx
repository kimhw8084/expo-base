import type { ReactNode } from 'react';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Chip, IconButton } from '@precision-calm/components';
import { Icon } from '@precision-calm/icons';
import { Text } from '@precision-calm/primitives';

export interface DataToolbarFilter {
  key: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export interface DataToolbarProps {
  searchLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string | undefined;
  filters?: readonly DataToolbarFilter[];
  summary?: string | undefined;
  actions?: ReactNode;
  testID?: string;
}

export function DataToolbar({
  searchLabel,
  query,
  onQueryChange,
  placeholder = 'Search',
  filters = [],
  summary,
  actions,
  testID,
}: DataToolbarProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useUnistyles();
  const clearLabel = `Clear ${searchLabel.toLowerCase()}`;

  return (
    <View
      accessibilityRole="toolbar"
      role="toolbar"
      accessibilityLabel="Data controls"
      aria-label="Data controls"
      style={styles.root}
      testID={testID}
    >
      <View style={styles.topRow}>
        <View
          accessibilityRole="search"
          accessibilityLabel={searchLabel}
          aria-label={searchLabel}
          style={[styles.searchShell, focused && styles.searchFocused]}
          testID={testID ? `${testID}-search-shell` : undefined}
        >
          <Icon name="search" size="sm" tone="secondary" />
          <TextInput
            accessibilityLabel={searchLabel}
            aria-label={searchLabel}
            value={query}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.tertiary}
            onChangeText={onQueryChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            inputMode="search"
            returnKeyType="search"
            maxFontSizeMultiplier={2}
            style={styles.searchInput}
          />
          {query ? (
            <IconButton
              icon="close"
              label={clearLabel}
              size="sm"
              variant="ghost"
              onPress={() => onQueryChange('')}
            />
          ) : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      {filters.length ? (
        <View style={styles.filters} accessibilityLabel="Filters">
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              selected={Boolean(filter.selected)}
              disabled={Boolean(filter.disabled)}
              onPress={filter.onPress}
            />
          ))}
        </View>
      ) : null}

      {summary ? (
        <Text
          variant="caption"
          tone="secondary"
          testID={testID ? `${testID}-summary` : undefined}
        >
          {summary}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    minWidth: 0,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: theme.strokeWidths.standard,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background.subtle,
  },
  topRow: {
    minWidth: 0,
    flexDirection: { compact: 'column', medium: 'row' },
    alignItems: { compact: 'stretch', medium: 'center' },
    gap: theme.spacing.sm,
  },
  searchShell: {
    minWidth: 0,
    width: { compact: '100%', medium: 'auto' },
    maxWidth: theme.contentWidths.reading,
    flexGrow: 1,
    minHeight: theme.controlHeights.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingStart: theme.formMetrics.inputHorizontalPadding,
    paddingEnd: theme.spacing.xs,
    borderWidth: theme.strokeWidths.standard,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.background.surface,
  },
  searchFocused: {
    borderColor: theme.colors.border.focus,
    boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}`,
  },
  searchInput: {
    minWidth: 0,
    flex: 1,
    minHeight: theme.controlHeights.md,
    color: theme.colors.text.primary,
    ...theme.typography.body,
    paddingVertical: theme.spacing.none,
  },
  actions: {
    minWidth: 0,
    width: { compact: '100%', medium: 'auto' },
    flexShrink: 0,
    alignItems: { compact: 'stretch', medium: 'flex-end' },
  },
  filters: {
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
