import { createReturnIntentChannel } from '@expo-base/auth';

/** Shared by native-intent processing and the auth runtime. Never persisted. */
export const authReturnIntent = createReturnIntentChannel({
  excludedPrefixes: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/unlock', '/auth'],
});
