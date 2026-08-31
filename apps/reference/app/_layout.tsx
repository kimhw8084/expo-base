import { PrecisionRuntimeProvider, usePrecisionAuth, usePrecisionAuthAccess, usePrecisionAuthorizationRequirement } from '@precision-calm/runtime';
import { ProtectedRouterStack, useCaptureReturnIntent } from '@precision-calm/navigation-router';
import { useUnistyles } from 'react-native-unistyles';
import { services } from '../services';
import { linking } from '../linking';
import { authReturnIntent } from '../auth';

const protectedScreens = [
  'index', 'accessibility-motion', 'auth-session', 'data', 'feedback', 'forms', 'golden', 'linking',
  'lists', 'navigation', 'overlays', 'services', 'stress', 'system', 'visualization', 'authorization',
] as const;

function RootNavigation() {
  const { theme } = useUnistyles();
  const auth = usePrecisionAuth();
  const access = usePrecisionAuthAccess();
  const settingsAccess = usePrecisionAuthorizationRequirement({ all: ['settings.manage'] });
  useCaptureReturnIntent({
    access,
    capture: auth.captureReturnIntent,
    publicPaths: ['/sign-in', '/session-loading', '/session-error', '/link-error'],
  });
  return (
    <ProtectedRouterStack
      access={access}
      routes={{
        always: ['link-error'],
        authenticated: protectedScreens,
        signedOut: ['sign-in'],
        booting: ['session-loading'],
        error: ['session-error'],
      }}
      conditionalAuthenticated={[{ key: 'settings-manage', guard: settingsAccess.allowed, screens: ['admin-demo'] }]}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background.canvas } }}
    />
  );
}

export default function RootLayout() {
  return (
    <PrecisionRuntimeProvider
      services={services}
      linking={linking}
      auth={{ returnIntentChannel: authReturnIntent }}
    >
      <RootNavigation />
    </PrecisionRuntimeProvider>
  );
}
