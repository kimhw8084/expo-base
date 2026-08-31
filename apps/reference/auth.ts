import { createReturnIntentChannel } from '@precision-calm/auth';

/** Shared by native-intent processing and the auth runtime. Never persisted. */
export const authReturnIntent = createReturnIntentChannel({
  excludedPrefixes: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/auth'],
});
