import { useEffect, useRef, type ComponentProps, type PropsWithChildren, type ReactNode } from 'react';
import { Link, Stack, useLocalSearchParams, usePathname, useRouter, type Href } from 'expo-router';
import { AdaptiveNavigationShell, type NavigationItem } from '@precision-calm/navigation';
import { bestNavigationMatch } from '@precision-calm/platform';

export type RouterNavigationItem = Omit<NavigationItem, 'href'> & { href: Href; matchPath?: string | undefined; matchPaths?: readonly string[] | undefined; };

/** Mirrors the internal navigation activation shape without promoting it to public API. */
interface RouterNavigationActivationEvent {
  altKey?: boolean | undefined;
  button?: number | undefined;
  ctrlKey?: boolean | undefined;
  metaKey?: boolean | undefined;
  nativeEvent?: unknown;
  preventDefault?: (() => void) | undefined;
  shiftKey?: boolean | undefined;
}

export function usePrecisionRouter() {
  const router = useRouter();
  return {
    push: (href: Href) => router.push(href),
    replace: (href: Href) => router.replace(href),
    replaceResolvedPath: (path: string) => { if (!path.startsWith('/')) throw new Error('Resolved app paths must start with /.'); router.replace(path as Href); },
    back: () => router.back(),
    backOr: (fallback: Href) => { if (router.canGoBack()) router.back(); else router.replace(fallback); },
    canGoBack: () => router.canGoBack(),
  } as const;
}

/** Route-param access stays behind the same Expo Router boundary as navigation. */
export function usePrecisionLocalSearchParams<TParams extends Record<string, string | string[]>>() {
  return useLocalSearchParams<TParams>();
}

export interface RouterNavigationShellProps extends PropsWithChildren {
  items: readonly RouterNavigationItem[];
  brand?: string | undefined;
  sidebarFooter?: ReactNode;
  brandMark?: string | undefined;
  enabled?: boolean;
}

export function RouterNavigationShell({ items, brand, sidebarFooter, brandMark, enabled = true, children }: RouterNavigationShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetched = useRef(new Set<string>());
  const navigationItems: readonly NavigationItem[] = items.map((item) => ({ ...item, href: Link.resolveHref(item.href) }));
  const contractItems = items.flatMap((item) => {
    const primary = item.matchPath ?? (typeof item.href === 'string' ? item.href : item.href.pathname);
    return [primary, ...(item.matchPaths ?? [])].filter((href): href is string => Boolean(href)).map((href) => ({ key: item.key, label: item.label, href }));
  });
  const activeKey = bestNavigationMatch(pathname, contractItems) ?? items[0]?.key ?? '';
  const prefetchHref = (href: Href) => {
    const identity = typeof href === 'string' ? href : JSON.stringify(href);
    if (prefetched.current.has(identity)) return;
    prefetched.current.add(identity);
    router.prefetch(href);
  };
  const prefetch = (key: string) => {
    const item = items.find((candidate) => candidate.key === key);
    if (!item) return;
    prefetchHref(item.href);
    for (const route of item.matchPaths ?? []) prefetchHref(route as Href);
  };
  const navigate = (key: string, event?: RouterNavigationActivationEvent) => {
    const item = items.find((candidate) => candidate.key === key);
    if (!item) return;
    const nativeMouse = event?.nativeEvent as { altKey?: boolean; button?: number; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } | undefined;
    const mouse = { ...nativeMouse, ...event };
    if (mouse?.metaKey || mouse?.ctrlKey || mouse?.shiftKey || mouse?.altKey || (mouse?.button !== undefined && mouse.button !== 0)) return;
    event?.preventDefault?.();
    router.push(item.href);
  };
  return <AdaptiveNavigationShell items={navigationItems} activeKey={activeKey} onNavigate={navigate} onNavigateIntent={prefetch} brand={brand} brandMark={brandMark} sidebarFooter={sidebarFooter} enabled={enabled}>{children}</AdaptiveNavigationShell>;
}

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
      <Stack.Protected guard={access === 'booting'}>{screens(routes.booting)}</Stack.Protected>
      <Stack.Protected guard={access === 'signed-out'}>{screens(routes.signedOut)}</Stack.Protected>
      <Stack.Protected guard={access === 'error'}>{screens(routes.error)}</Stack.Protected>
      {routes.locked?.length ? <Stack.Protected guard={access === 'locked'}>{screens(routes.locked)}</Stack.Protected> : null}
      <Stack.Protected guard={access === 'granted'}>{screens(routes.authenticated)}</Stack.Protected>
      {conditionalAuthenticated.map((group) => <Stack.Protected key={group.key} guard={access === 'granted' && group.guard}>{screens(group.screens)}</Stack.Protected>)}
      {screens(routes.always ?? [])}
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
 * Captures the last granted private path before access is restricted.
 * Stack.Protected owns the restrictive-state destination; this hook owns only
 * return-intent memory so URL state and navigator state cannot diverge. Native
 * incoming links can additionally record intent before Router evaluates guards.
 */
export function useCaptureReturnIntent({ access, capture, publicPaths = [] }: CaptureReturnIntentOptions) {
  const pathname = usePathname();
  const lastGrantedPath = useRef<string | null>(null);
  const previousAccess = useRef<ProtectedAccessState>(access);

  if (access === 'granted' && !publicPaths.includes(pathname)) lastGrantedPath.current = pathname;

  useEffect(() => {
    const previous = previousAccess.current;
    previousAccess.current = access;
    if (access !== 'signed-out' && access !== 'locked') return;

    const isPublicPath = publicPaths.includes(pathname);
    const intent = previous === 'granted'
      ? lastGrantedPath.current
      : (!isPublicPath ? pathname : lastGrantedPath.current);
    if (intent && !publicPaths.includes(intent)) capture(intent);

  }, [access, capture, pathname, publicPaths]);
}
