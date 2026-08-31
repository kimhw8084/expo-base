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
}
export function ListRow({ title, subtitle, leadingIcon, trailing, onPress, selected = false, disabled = false }: ListRowProps) {
  const density = useDensity();
  const { hovered, focused, interactionProps } = useInteractionState();
  const content = <>{leadingIcon ? <View style={styles.icon}><Icon name={leadingIcon} size="sm" tone="secondary" /></View> : null}<VStack gap="xs"><Text variant="label" numberOfLines={1}>{title}</Text>{subtitle ? <Text variant="caption" tone="secondary" numberOfLines={2}>{subtitle}</Text> : null}</VStack><View style={styles.spacer} />{trailing}</>;
  if (!onPress) return <View style={[styles.row, density === 'compact' && styles.compact]}>{content}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} {...interactionProps} style={({ pressed }) => [styles.row, density === 'compact' && styles.compact, styles.pressable, selected && styles.selected, hovered && !disabled && styles.hovered, focused && styles.focused, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>{content}</Pressable>;
}
const styles = StyleSheet.create((theme) => ({
  row: { minWidth: 0, minHeight: theme.componentMetrics.dataListRowMinHeight, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  compact: { minHeight: theme.controlHeights.md, paddingVertical: theme.spacing.xs },
  pressable: { borderRadius: theme.radii.sm, borderWidth: 1, borderColor: theme.colors.transparent, paddingHorizontal: theme.spacing.sm },
  icon: { width: theme.controlHeights.sm, height: theme.controlHeights.sm, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.subtle },
  spacer: { flex: 1 }, selected: { backgroundColor: theme.colors.interactive.subtle }, hovered: { backgroundColor: theme.colors.interactive.subtleHover }, focused: { borderColor: theme.colors.border.focus }, pressed: { opacity: theme.interactionFeedback.pressedOpacity }, disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
