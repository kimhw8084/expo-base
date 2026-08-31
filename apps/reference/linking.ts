import { createPrecisionLinkingRuntime } from '@precision-calm/linking';
import { ExpoExternalNavigationAdapter } from '@precision-calm/linking-expo';
import { authReturnIntent } from './auth';

export const linking = createPrecisionLinkingRuntime({
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
    appSchemes: ['precision-calm'],
    universalLinkHosts: [],
    callbackRules: [{ path: '/auth/callback', allowedQueryKeys: ['code', 'state', 'error', 'error_description'], requiredQueryKeys: ['state'] }],
    rejectedRoute: '/link-error',
  },
});
