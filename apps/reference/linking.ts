import { createExpoBaseLinkingRuntime } from '@expo-base/linking';
import { ExpoExternalNavigationAdapter } from '@expo-base/linking-expo';
import { authReturnIntent } from './auth';

export const linking = createExpoBaseLinkingRuntime({
  adapter: new ExpoExternalNavigationAdapter(),
  externalPolicy: {
    allowHttps: true,
    allowedHosts: [
      { host: 'expo.dev', allowSubdomains: true },
      { host: 'docs.expo.dev', allowSubdomains: true },
    ],
    allowMailto: false,
    allowTel: false,
  },
  onIncomingRoute: (route) => { authReturnIntent.capture(route); },
  incomingPolicy: {
    appSchemes: ['expo-base', 'expo-base'],
    universalLinkHosts: [],
    callbackRules: [{ path: '/auth/callback', allowedQueryKeys: ['code', 'state', 'error', 'error_description'], requiredQueryKeys: ['state'] }],
    rejectedRoute: '/link-error',
  },
});
