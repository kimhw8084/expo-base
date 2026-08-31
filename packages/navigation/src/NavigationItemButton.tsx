import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';
import type { NavigationItem } from './types';

interface Props {
  item: NavigationItem;
  active: boolean;
  mode: 'sidebar' | 'bottom';
  onPress: () => void;
}

export function NavigationItemButton({ item, active, mode, onPress }: Props) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active, disabled: item.disabled }}
      disabled={item.disabled}
      onPress={onPress}
      {...interactionProps}
      style={({ pressed }) => [
        styles.base,
        mode === 'sidebar' ? styles.sidebar : styles.bottom,
        active && styles.active,
        hovered && !item.disabled && styles.hovered,
        focused && styles.focused,
        pressed && !item.disabled && styles.pressed,
        item.disabled && styles.disabled,
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name={item.icon} size={mode === 'bottom' ? 'md' : 'sm'} tone={active ? 'accent' : 'secondary'} />
        {item.badge ? <View style={styles.badgeDot}><Text variant="micro" tone="onPrimary">{item.badge}</Text></View> : null}
      </View>
      <Text variant={mode === 'bottom' ? 'micro' : 'label'} tone={active ? 'primary' : 'secondary'} numberOfLines={1}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: { minWidth: 0, borderWidth: 1, borderColor: theme.colors.transparent },
  sidebar: { minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  bottom: { minHeight: theme.componentMetrics.bottomNavigationItem, flex: 1, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xxs, paddingHorizontal: theme.spacing.xs },
  active: { backgroundColor: theme.colors.interactive.subtle, borderColor: theme.colors.transparent },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.interactive.subtle}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  iconWrap: { minWidth: 0, position: 'relative' },
  badgeDot: { position: 'absolute', top: -theme.spacing.sm, right: -theme.spacing.md, minWidth: theme.componentMetrics.navigationBadge, height: theme.componentMetrics.navigationBadge, borderRadius: theme.radii.full, paddingHorizontal: theme.spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.feedback.negative },
}));
