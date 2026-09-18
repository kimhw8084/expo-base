import '../unistyles';
import { useMemo } from 'react';
import { ExpoBaseRuntimeProvider, ExpoBaseSessionSecurityBootstrap, useExpoBaseAuth, useExpoBaseAuthAccess, useExpoBaseAuthorizationRequirement } from '@expo-base/runtime';
import { ProtectedRouterStack, RouterNavigationShell, useCaptureReturnIntent, type RouterNavigationItem } from '@expo-base/navigation-router';
import { useUnistyles } from 'react-native-unistyles';
import { LoadingState, Screen, Text, VStack } from '@expo-base/ui';
import { services } from '../services';
import { linking } from '../linking';
import { authReturnIntent } from '../auth';
import { sessionSecurity } from '../sessionSecurity';
import { referenceCapabilities } from '../capabilities';
import { ThemeRuntimeSync } from '../ThemeRuntimeSync';
import { ReferenceRuntimeSettingsProvider, useReferenceRuntimeSettings } from '../ReferenceRuntimeSettings';
import { useReferenceCopy } from '../ReferenceCopy';


const referenceNavigationItems = [
  { key: 'home', label: 'Home', icon: 'home', href: '/' },
  { key: 'build', label: 'Build', icon: 'edit', href: '/forms', matchPaths: ['/forms', '/navigation', '/overlays', '/lists'] },
  { key: 'data', label: 'Data', icon: 'arrowUpDown', href: '/data', matchPaths: ['/data', '/visualization', '/feedback', '/server-state'] },
  { key: 'patterns', label: 'Patterns', icon: 'star', href: '/golden', matchPaths: ['/golden', '/workflows', '/stress'] },
  { key: 'system', label: 'System', icon: 'command', href: '/system', matchPaths: ['/system', '/golden-plus', '/accessibility-motion', '/services', '/linking', '/auth-session', '/session-security', '/authorization', '/admin-demo'] },
] as const satisfies readonly RouterNavigationItem[];

const protectedScreens = [
  'index', 'accessibility-motion', 'auth-session', 'data', 'feedback', 'forms', 'golden', 'linking',
  'lists', 'navigation', 'overlays', 'services', 'server-state', 'stress', 'system', 'golden-plus', 'visualization', 'authorization', 'session-security', 'capabilities', 'workflows', 'analytics-showcase', 'finance-showcase', 'monitoring-showcase',
  'chg-110-submit',
] as const;

function RootNavigation() {
  const { theme } = useUnistyles();
  const auth = useExpoBaseAuth();
  const access = useExpoBaseAuthAccess();
  const settingsAccess = useExpoBaseAuthorizationRequirement({ all: ['settings.manage'] });
  const { themeMode, density, locale, motionMode } = useReferenceRuntimeSettings();
  const copy = useReferenceCopy();
  const localizedNavigationItems = useMemo(() => referenceNavigationItems.map((item) => ({ ...item, label: copy(item.label) })), [copy]);
  useCaptureReturnIntent({
    access,
    capture: auth.captureReturnIntent,
    publicPaths: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/unlock'],
  });
  if (auth.status === 'loading') {
    return <Screen><LoadingState label="Restoring account session…" /></Screen>;
  }
  return (
    <RouterNavigationShell
      items={localizedNavigationItems}
      brand="Expo Base"
      brandMark="E"
      enabled={access === 'granted'}
      sidebarFooter={<VStack gap="xs"><Text variant="micro" tone="secondary">RUNTIME</Text><Text variant="caption" tone="secondary">{themeMode} · {density} · {locale} · {motionMode}</Text></VStack>}
    >
      <ProtectedRouterStack
        access={access}
        routes={{
          always: ['link-error', '+not-found'],
          authenticated: protectedScreens,
          signedOut: ['sign-in'],
          booting: ['session-loading'],
          error: ['session-error'],
          locked: ['unlock'],
        }}
        conditionalAuthenticated={[{ key: 'settings-manage', guard: settingsAccess.allowed, screens: ['admin-demo'] }]}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background.canvas } }}
      />
    </RouterNavigationShell>
  );
}

function ReferenceRuntime() {
  const { themeMode, density, locale, motionMode } = useReferenceRuntimeSettings();
  return (
    <>
      <ThemeRuntimeSync mode={themeMode} />
      <ExpoBaseRuntimeProvider
        density={density}
        i18n={{ locale, fallbackLocale: 'en-US' }}
        capabilities={referenceCapabilities}
        {...(motionMode === 'reduced' ? { motion: { reducedMotion: true } } : {})}
        services={services}
        linking={linking}
        auth={{ returnIntentChannel: authReturnIntent }}
        sessionSecurity={{ adapter: sessionSecurity }}
      >
        <ExpoBaseSessionSecurityBootstrap fallback={<Screen><LoadingState label="Restoring secure session…" /></Screen>}>
          <RootNavigation />
        </ExpoBaseSessionSecurityBootstrap>
      </ExpoBaseRuntimeProvider>
    </>
  );
}

export default function RootLayout() {
  return <ReferenceRuntimeSettingsProvider><ReferenceRuntime /></ReferenceRuntimeSettingsProvider>;
}
