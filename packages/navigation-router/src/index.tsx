import type { PropsWithChildren, ReactNode } from 'react';
import { usePathname, useRouter, type Href } from 'expo-router';
import { AdaptiveNavigationShell, type NavigationItem } from '@precision-calm/navigation';
import { bestNavigationMatch } from '@precision-calm/platform';

export interface RouterNavigationItem extends NavigationItem { href: Href; matchPath?: string | undefined; }

export function usePrecisionRouter() {
  const router = useRouter();
  return {
    push: (href: Href) => router.push(href),
    replace: (href: Href) => router.replace(href),
    back: () => router.back(),
    canGoBack: () => router.canGoBack(),
  } as const;
}

export interface RouterNavigationShellProps extends PropsWithChildren {
  items: readonly RouterNavigationItem[];
  brand?: string | undefined;
  sidebarFooter?: ReactNode;
}

export function RouterNavigationShell({ items, brand, sidebarFooter, children }: RouterNavigationShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const contractItems = items.map((item) => ({ key: item.key, label: item.label, href: item.matchPath ?? (typeof item.href === 'string' ? item.href : item.href.pathname) }));
  const activeKey = bestNavigationMatch(pathname, contractItems) ?? items[0]?.key ?? '';
  const navigate = (key: string) => { const item = items.find((candidate) => candidate.key === key); if (item) router.push(item.href); };
  return <AdaptiveNavigationShell items={items} activeKey={activeKey} onNavigate={navigate} brand={brand} sidebarFooter={sidebarFooter}>{children}</AdaptiveNavigationShell>;
}

import { useEffect, type ComponentProps } from 'react';
import { validateProtectedRouteSets, type ProtectedAccessState, type ProtectedRouteSets } from '@precision-calm/auth';

export interface ConditionalAuthenticatedRouteSet { key: string; guard: boolean; screens: readonly string[]; }

export interface ProtectedRouterStackProps {
  access: ProtectedAccessState;
  routes: ProtectedRouteSets;
  /** Nested client-side capability/entitlement guards evaluated only after authentication. */
  conditionalAuthenticated?: readonly ConditionalAuthenticatedRouteSet[];
  screenOptions?: ComponentProps<typeof Stack>['screenOptions'];
}

/**
 * Expo Router protected-route owner. During auth bootstrap only booting screens
 * are available, so protected UI cannot flash before the session is resolved.
 */
export function ProtectedRouterStack({ access, routes, conditionalAuthenticated = [], screenOptions }: ProtectedRouterStackProps) {
  const validation = validateProtectedRouteSets(routes);
  if (!validation.valid) {
    throw new Error(`Invalid protected route sets. duplicates=${validation.duplicates.join(',') || 'none'} missing=${validation.missingForAccess.join(',') || 'none'}`);
  }
  if (access === 'locked' && !(routes.locked?.length)) {
    throw new Error('ProtectedRouterStack received access="locked" without a locked route.');
  }
  const baseScreens = new Set([...(routes.always ?? []), ...routes.authenticated, ...routes.signedOut, ...routes.booting, ...routes.error, ...(routes.locked ?? [])]);
  const conditionalSeen = new Set<string>();
  for (const group of conditionalAuthenticated) for (const screen of group.screens) { if (baseScreens.has(screen) || conditionalSeen.has(screen)) throw new Error(`ProtectedRouterStack duplicate conditional screen: ${screen}`); conditionalSeen.add(screen); }
  const screens = (names: readonly string[]) => names.map((name) => <Stack.Screen key={name} name={name} />);
  return (
    <Stack screenOptions={screenOptions}>
      {screens(routes.always ?? [])}
      <Stack.Protected guard={access === 'booting'}>{screens(routes.booting)}</Stack.Protected>
      <Stack.Protected guard={access === 'signed-out'}>{screens(routes.signedOut)}</Stack.Protected>
      <Stack.Protected guard={access === 'error'}>{screens(routes.error)}</Stack.Protected>
      {routes.locked?.length ? <Stack.Protected guard={access === 'locked'}>{screens(routes.locked)}</Stack.Protected> : null}
      <Stack.Protected guard={access === 'granted'}>{screens(routes.authenticated)}{conditionalAuthenticated.map((group) => <Stack.Protected key={group.key} guard={group.guard}>{screens(group.screens)}</Stack.Protected>)}</Stack.Protected>
    </Stack>
  );
}

export interface CaptureReturnIntentOptions {
  access: ProtectedAccessState;
  capture(path: string): boolean;
  /** Exact public paths that should never be captured as a post-auth target. */
  publicPaths?: readonly string[];
}

/**
 * Best-effort web/client navigation intent capture. Native incoming links can
 * additionally record intent before Router evaluates protected guards.
 */
export function useCaptureReturnIntent({ access, capture, publicPaths = [] }: CaptureReturnIntentOptions) {
  const pathname = usePathname();
  useEffect(() => {
    if (access !== 'signed-out' && access !== 'locked') return;
    if (publicPaths.includes(pathname)) return;
    capture(pathname);
  }, [access, capture, pathname, publicPaths]);
}
