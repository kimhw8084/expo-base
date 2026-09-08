import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon, type IconName } from '@precision-calm/icons';
import { Text, VStack, useDensity, useInteractionState } from '@precision-calm/primitives';

export interface ListRowProps {
  title: string;
  subtitle?: string | undefined;
  leadingIcon?: IconName | undefined;
  trailing?: ReactNode;
  onPress?: (() => void) | undefined;
  selected?: boolean;
  disabled?: boolean;
  disclosure?: boolean;
  divider?: boolean;
  contentPolicy?: 'truncate' | 'wrap';
  accessibilityLabel?: string;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  leadingIcon,
  trailing,
  onPress,
  selected = false,
  disabled = false,
  disclosure = true,
  divider = true,
  contentPolicy = 'truncate',
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const density = useDensity();
  const { hovered, focused, interactionProps } = useInteractionState();
  const resolvedTrailing = trailing ?? (onPress && disclosure ? <Icon name="chevronRight" size="sm" tone="tertiary" /> : null);
  const content = (
    <>
      {leadingIcon ? <View style={styles.icon}><Icon name={leadingIcon} size="sm" tone={selected ? 'accent' : 'secondary'} /></View> : null}
      <View style={styles.copy}>
        <VStack gap="xs">
          <Text variant="label" numberOfLines={contentPolicy === 'truncate' ? 2 : undefined}>{title}</Text>
          {subtitle ? <Text variant="caption" tone="secondary" numberOfLines={contentPolicy === 'truncate' ? 2 : undefined}>{subtitle}</Text> : null}
        </VStack>
      </View>
      <View style={styles.spacer} />
      {resolvedTrailing ? <View style={styles.trailing}>{resolvedTrailing}</View> : null}
    </>
  );

  if (!onPress) return <View testID={testID} style={[styles.row, !divider && styles.noDivider, density === 'compact' && styles.compact]}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      role="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join('. ')}
      aria-label={accessibilityLabel ?? [title, subtitle].filter(Boolean).join('. ')}
      accessibilityState={{ selected, disabled }}
      aria-pressed={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      {...interactionProps}
      style={({ pressed }) => [
        styles.row,
        !divider && styles.noDivider,
        density === 'compact' && styles.compact,
        styles.pressable,
        selected && styles.selected,
        hovered && !disabled && styles.hovered,
        selected && hovered && !disabled && styles.selectedHovered,
        focused && styles.focused,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    minWidth: 0,
    minHeight: theme.componentMetrics.dataListRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: theme.strokeWidths.standard,
    borderBottomColor: theme.colors.border.subtle,
  },
  compact: { minHeight: theme.controlHeights.md, paddingVertical: theme.spacing.xs },
  noDivider: { borderBottomWidth: 0 },
  pressable: {
    borderRadius: theme.radii.sm,
    borderWidth: theme.strokeWidths.standard,
    borderColor: theme.colors.transparent,
  },
  icon: {
    width: theme.controlHeights.sm,
    height: theme.controlHeights.sm,
    flexShrink: 0,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.subtle,
  },
  copy: { minWidth: 0, flexShrink: 1 },
  spacer: { flex: 1 },
  trailing: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: theme.colors.interactive.subtle, borderColor: theme.colors.interactive.primary },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  selectedHovered: { backgroundColor: theme.colors.interactive.subtleHover, borderColor: theme.colors.interactive.primary },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
