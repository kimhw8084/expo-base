import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SidebarNavigation } from './SidebarNavigation';
import { BottomNavigation } from './BottomNavigation';
import type { NavigationItem } from './types';

type NavigationActivationEvent = {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  nativeEvent?: unknown;
  preventDefault?: () => void;
  shiftKey?: boolean;
};

export interface AdaptiveNavigationShellProps extends PropsWithChildren {
  items: readonly NavigationItem[];
  activeKey: string;
  onNavigate: (key: string, event?: NavigationActivationEvent) => void;
  onNavigateIntent?: ((key: string) => void) | undefined;
  brand?: string | undefined;
  sidebarFooter?: ReactNode;
  brandMark?: string | undefined;
  enabled?: boolean;
}

export function AdaptiveNavigationShell({ items, activeKey, onNavigate, onNavigateIntent, brand, sidebarFooter, brandMark, enabled = true, children }: AdaptiveNavigationShellProps) {
  if (!enabled) return <View style={styles.root}><View style={styles.content}>{children}</View></View>;

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <SidebarNavigation items={items} activeKey={activeKey} onNavigate={onNavigate} onNavigateIntent={onNavigateIntent} brand={brand} brandMark={brandMark} footer={sidebarFooter} />
      </View>
      <View style={styles.content}>{children}</View>
      <View style={styles.bottom}>
        <BottomNavigation items={items} activeKey={activeKey} onNavigate={onNavigate} onNavigateIntent={onNavigateIntent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  root: {
    flex: 1,
    minWidth: 0,
    flexDirection: { compact: 'column', medium: 'column', expanded: 'row', wide: 'row' },
  },
  sidebar: {
    display: { compact: 'none', medium: 'none', expanded: 'flex', wide: 'flex' },
    flexShrink: 0,
  },
  content: { flex: 1, minWidth: 0, minHeight: 0 },
  bottom: {
    display: { compact: 'flex', medium: 'flex', expanded: 'none', wide: 'none' },
    flexShrink: 0,
  },
}));
