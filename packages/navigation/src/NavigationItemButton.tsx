import { forwardRef, type ComponentRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { Text, useInteractionState } from '@precision-calm/primitives';
import type { NavigationItem } from './types';

type NavigationActivationHandler = (event?: {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  nativeEvent?: unknown;
  preventDefault?: () => void;
  shiftKey?: boolean;
}) => void;

interface Props {
  item: NavigationItem;
  active: boolean;
  mode: 'sidebar' | 'bottom';
  onPress: NavigationActivationHandler;
  onIntent?: (() => void) | undefined;
  tabIndex?: 0 | -1 | undefined;
  onKeyDown?: ((event: { key: string; preventDefault: () => void }) => void) | undefined;
}

export const NavigationItemButton = forwardRef<ComponentRef<typeof Pressable>, Props>(function NavigationItemButton({ item, active, mode, onPress, onIntent, tabIndex, onKeyDown }, ref) {
  const { hovered, focused, interactionProps } = useInteractionState();
  const keyboardProps = Platform.OS === 'web' && onKeyDown ? { onKeyDown } : {};
  const routeDestination = Platform.OS === 'web' && Boolean(item.href);
  const role = routeDestination ? 'link' : mode === 'bottom' ? 'tab' : 'button';
  const hrefProps = routeDestination ? { href: item.href } : {};
  return (
    <Pressable
      ref={ref}
      testID={`navigation-item-${item.key}`}
      accessibilityRole={role}
      role={role}
      accessibilityLabel={item.label}
      aria-label={item.label}
      accessibilityState={{ selected: active, disabled: item.disabled }}
      aria-current={routeDestination && active ? 'page' : undefined}
      aria-selected={!routeDestination && mode === 'bottom' ? active : undefined}
      aria-pressed={!routeDestination && mode === 'sidebar' ? active : undefined}
      aria-disabled={item.disabled}
      disabled={item.disabled}
      tabIndex={tabIndex}
      onPress={onPress}
      onPressIn={onIntent}
      {...keyboardProps}
      {...hrefProps}
      {...interactionProps}
      onHoverIn={() => { interactionProps.onHoverIn(); onIntent?.(); }}
      onFocus={() => { interactionProps.onFocus(); onIntent?.(); }}
      style={({ pressed }) => [
        styles.base,
        mode === 'sidebar' ? styles.sidebar : styles.bottom,
        active && styles.active,
        hovered && !item.disabled && styles.hovered,
        active && hovered && !item.disabled && styles.activeHovered,
        focused && styles.focused,
        pressed && !item.disabled && styles.pressed,
        item.disabled && styles.disabled,
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name={item.icon} size={mode === 'bottom' ? 'md' : 'sm'} tone={active ? 'accent' : 'secondary'} />
        {item.badge ? <View style={styles.badgeDot}><Text variant="micro" tone="onPrimary">{item.badge}</Text></View> : null}
      </View>
      <Text testID={`navigation-label-${item.key}`} variant={mode === 'bottom' ? 'micro' : 'label'} tone={active ? 'primary' : 'secondary'} align={mode === 'bottom' ? 'center' : 'start'} numberOfLines={mode === 'bottom' ? 3 : 1}>{item.label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  base: { minWidth: 0, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  sidebar: { minHeight: theme.controlHeights.md, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.sm, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  bottom: { minHeight: theme.componentMetrics.bottomNavigationItem, flex: 1, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xxs, paddingHorizontal: { compact: theme.spacing.xxs, medium: theme.spacing.xs } },
  active: { backgroundColor: theme.colors.interactive.subtle, borderColor: theme.colors.transparent },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  activeHovered: { backgroundColor: theme.colors.interactive.subtlePressed },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
  iconWrap: { minWidth: 0, position: 'relative' },
  badgeDot: { position: 'absolute', top: -theme.spacing.sm, end: -theme.spacing.md, minWidth: theme.componentMetrics.navigationBadge, height: theme.componentMetrics.navigationBadge, borderRadius: theme.radii.full, paddingHorizontal: theme.spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.feedback.negative },
}));
