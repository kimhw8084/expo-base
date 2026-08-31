import {
  MemoryAuthAdapter,
  MemoryAuthorizationAdapter,
  MemoryKeyValueStorage,
  NoopAnalyticsAdapter,
  PassthroughImageProvider,
  type AppServices,
} from '@precision-calm/adapters';

/** Reference-only deterministic services. Production apps replace these adapters. */
export const services: AppServices = {
  auth: new MemoryAuthAdapter({ user: { id: 'reference-user', email: 'reference@example.com', displayName: 'Reference User' } }),
  authorization: new MemoryAuthorizationAdapter({ 'reference-user': ['reports.view', 'rewards.optimize', 'settings.manage'] }),
  storage: new MemoryKeyValueStorage(),
  analytics: new NoopAnalyticsAdapter(),
  images: new PassthroughImageProvider(),
};
