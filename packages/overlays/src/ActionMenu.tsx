import { useEffect, useId, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { IconName } from '@precision-calm/icons';
import { Text } from '@precision-calm/primitives';
import { resolveRovingFocusIndex } from '@precision-calm/platform';
import { MenuGroup, MenuItem } from './Menu';
import { Popover, type PopoverProps } from './Popover';

export interface ActionMenuItem {
  key: string;
  label: string;
  onPress: () => void;
  icon?: IconName | undefined;
  shortcut?: string | undefined;
  destructive?: boolean | undefined;
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
}

export interface ActionMenuSection {
  key: string;
  label?: string | undefined;
  items: readonly ActionMenuItem[];
}

export interface ActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: ReactNode;
  sections: readonly ActionMenuSection[];
  accessibilityLabel?: string | undefined;
  placement?: PopoverProps['placement'];
  testID?: string | undefined;
}

export function ActionMenu({
  open,
  onOpenChange,
  anchor,
  sections,
  accessibilityLabel = 'Actions',
  placement = 'bottom-start',
  testID,
}: ActionMenuProps) {
  const flattenedItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);
  const menuId = `precision-action-menu-${useId().replaceAll(':', '')}`;
  const enabled = flattenedItems.map((item) => !item.disabled);
  const preferredIndex = flattenedItems.findIndex((item, index) => item.selected && enabled[index]);
  const initialIndex = preferredIndex >= 0 ? preferredIndex : enabled.findIndex(Boolean);
  const [focusedIndex, setFocusedIndex] = useState(Math.max(0, initialIndex));
  const itemRefs = useRef<Array<ComponentRef<typeof Pressable> | null>>([]);

  useEffect(() => {
    if (open) setFocusedIndex(Math.max(0, initialIndex));
  }, [initialIndex, open]);

  useEffect(() => {
    if (!open) return;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const items = document.getElementById(menuId)?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items?.[focusedIndex]?.focus();
      return;
    }
    itemRefs.current[focusedIndex]?.focus();
  }, [focusedIndex, menuId, open]);

  const navigate = (index: number, event: { key: string; preventDefault: () => void }) => {
    const next = resolveRovingFocusIndex(event.key, index, enabled, { orientation: 'both' });
    if (next === null) return;
    event.preventDefault();
    setFocusedIndex(next);
    itemRefs.current[next]?.focus();
  };

  let itemIndex = -1;
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      anchor={anchor}
      placement={placement}
      accessibilityLabel={accessibilityLabel}
    >
      <MenuGroup nativeID={menuId} accessibilityLabel={accessibilityLabel} testID={testID}>
        {sections.map((section, sectionIndex) => (
          <View key={section.key} style={styles.section}>
            {sectionIndex > 0 ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.separator} /> : null}
            {section.label ? (
              <View style={styles.sectionLabel}>
                <Text variant="micro" tone="secondary">
                  {section.label}
                </Text>
              </View>
            ) : null}
            {section.items.map((item) => {
              itemIndex += 1;
              const index = itemIndex;
              return <MenuItem
                ref={(node) => {
                  itemRefs.current[index] = node;
                  if (open && index === focusedIndex) node?.focus();
                }}
                key={item.key}
                label={item.label}
                onPress={() => {
                  onOpenChange(false);
                  item.onPress();
                }}
                {...(item.icon !== undefined ? { icon: item.icon } : {})}
                destructive={Boolean(item.destructive)}
                disabled={Boolean(item.disabled)}
                selected={Boolean(item.selected)}
                tabIndex={!item.disabled && index === focusedIndex ? 0 : -1}
                onKeyDown={(event) => navigate(index, event)}
                {...(item.shortcut !== undefined ? { trailing: <Text variant="micro" tone="tertiary">{item.shortcut}</Text> } : {})}
              />;
            })}
          </View>
        ))}
      </MenuGroup>
    </Popover>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { minWidth: 0 },
  sectionLabel: { paddingHorizontal: theme.spacing.sm, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xs },
  separator: { height: theme.strokeWidths.standard, marginVertical: theme.spacing.xs, backgroundColor: theme.colors.border.subtle },
}));
