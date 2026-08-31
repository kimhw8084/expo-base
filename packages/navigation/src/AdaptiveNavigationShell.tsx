import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SidebarNavigation } from './SidebarNavigation';
import { BottomNavigation } from './BottomNavigation';
import type { NavigationItem } from './types';

export interface AdaptiveNavigationShellProps extends PropsWithChildren {
  items: readonly NavigationItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  brand?: string | undefined;
  sidebarFooter?: ReactNode;
}

export function AdaptiveNavigationShell({ items, activeKey, onNavigate, brand, sidebarFooter, children }: AdaptiveNavigationShellProps) {
  return (
    <View style={styles.root}>
      <View style={styles.compactShell}><View style={styles.content}>{children}</View><BottomNavigation items={items} activeKey={activeKey} onNavigate={onNavigate} /></View>
      <View style={styles.desktopShell}><SidebarNavigation items={items} activeKey={activeKey} onNavigate={onNavigate} brand={brand} footer={sidebarFooter} /><View style={styles.content}>{children}</View></View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  root: { flex: 1, minWidth: 0 },
  compactShell: { flex: 1, minWidth: 0, display: { compact: 'flex', medium: 'flex', expanded: 'none' } },
  desktopShell: { flex: 1, minWidth: 0, flexDirection: 'row', display: { compact: 'none', medium: 'none', expanded: 'flex' } },
  content: { flex: 1, minWidth: 0 },
}));
