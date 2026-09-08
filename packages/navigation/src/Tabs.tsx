import { forwardRef, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { usePrecisionDirection } from '@precision-calm/i18n';
import { Icon } from '@precision-calm/icons';
import { resolveRovingFocusIndex } from '@precision-calm/platform';
import { Text, useInteractionState } from '@precision-calm/primitives';

export interface TabItem { key: string; label: string; disabled?: boolean | undefined; }
export interface TabsProps { items: readonly TabItem[]; activeKey: string; onChange: (key: string) => void; accessibilityLabel?: string; }
export function Tabs({ items, activeKey, onChange, accessibilityLabel = 'Sections' }: TabsProps) {
  const direction = usePrecisionDirection();
  const itemRefs = useRef<Array<ComponentRef<typeof Pressable> | null>>([]);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const enabled = items.map((item) => !item.disabled);
  const activeIndex = items.findIndex((item, index) => item.key === activeKey && enabled[index]);
  const tabStopIndex = activeIndex >= 0 ? activeIndex : enabled.findIndex(Boolean);
  const overflow = contentWidth > viewportWidth + 1;
  useEffect(() => {
    if (Platform.OS !== 'web' || activeIndex < 0) return;
    const node = itemRefs.current[activeIndex] as unknown as {
      closest?: (selector: string) => {
        getBoundingClientRect: () => { left: number; right: number };
        scrollBy: (options: { left: number; behavior: 'auto' }) => void;
      } | null;
      getBoundingClientRect?: () => { left: number; right: number };
    } | null;
    const viewport = node?.closest?.('[role="tablist"]');
    if (!viewport || !node?.getBoundingClientRect) return;
    const viewportRect = viewport.getBoundingClientRect();
    const itemRect = node.getBoundingClientRect();
    const delta = itemRect.left < viewportRect.left
      ? itemRect.left - viewportRect.left
      : itemRect.right > viewportRect.right
        ? itemRect.right - viewportRect.right
        : 0;
    if (delta !== 0) viewport.scrollBy({ left: delta, behavior: 'auto' });
  }, [activeIndex]);
  const navigate = (index: number, event: WebKeyboardEvent) => {
    const next = resolveRovingFocusIndex(event.key, index, enabled, { direction });
    if (next === null) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
    const item = items[next];
    if (item) onChange(item.key);
  };
  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroller}
        accessibilityRole="tablist"
        role="tablist"
        accessibilityLabel={accessibilityLabel}
        aria-label={accessibilityLabel}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
      >
        {items.map((item, index) => <TabButton ref={(node) => { itemRefs.current[index] = node; }} key={item.key} item={item} active={item.key === activeKey} tabIndex={index === tabStopIndex ? 0 as const : -1 as const} onKeyDown={(event) => navigate(index, event)} onPress={() => onChange(item.key)} />)}
      </ScrollView>
      {overflow && activeIndex < items.length - 1 ? <View testID="tabs-overflow-affordance" accessible={false} pointerEvents="none" style={styles.overflowAffordance}><Icon name={direction === 'rtl' ? 'chevronLeft' : 'chevronRight'} size="sm" tone="secondary" /></View> : null}
    </View>
  );
}
type WebKeyboardEvent = { key: string; preventDefault: () => void };
const TabButton = forwardRef<ComponentRef<typeof Pressable>, { item: TabItem; active: boolean; tabIndex: 0 | -1; onKeyDown: (event: WebKeyboardEvent) => void; onPress: () => void }>(function TabButton({ item, active, tabIndex, onKeyDown, onPress }, ref) {
  const { theme } = useUnistyles();
  const { hovered, focused, interactionProps } = useInteractionState();
  const keyboardProps = Platform.OS === 'web' ? { onKeyDown } : {};
  return <Pressable ref={ref} accessibilityRole="tab" role="tab" accessibilityLabel={item.label} aria-label={item.label} accessibilityState={{ selected: active, disabled: item.disabled }} aria-selected={active} aria-disabled={item.disabled} disabled={item.disabled} tabIndex={tabIndex} onPress={onPress} {...keyboardProps} hitSlop={theme.interactionFeedback.compactHitSlop} {...interactionProps} style={({ pressed }) => [styles.tab, active && styles.active, hovered && !item.disabled && styles.hovered, active && hovered && !item.disabled && styles.activeHovered, focused && styles.focused, pressed && !item.disabled && styles.pressed, item.disabled && styles.disabled]}><Text variant="label" tone={active ? 'primary' : 'secondary'} numberOfLines={1}>{item.label}</Text></Pressable>;
});
const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0, position: 'relative' },
  scroller: { gap: theme.spacing.xs, padding: theme.spacing.xs },
  overflowAffordance: { position: 'absolute', top: theme.spacing.xs, bottom: theme.spacing.xs, end: 0, width: theme.controlHeights.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.surface, borderStartWidth: theme.strokeWidths.standard, borderStartColor: theme.colors.border.default },
  tab: { minHeight: theme.controlHeights.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  active: { backgroundColor: theme.colors.background.subtle },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  activeHovered: { backgroundColor: theme.colors.interactive.subtlePressed },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
  disabled: { opacity: theme.interactionFeedback.disabledOpacity },
}));
