import {
  MemoryAuthAdapter,
  MemoryAuthorizationAdapter,
  MemoryKeyValueStorage,
  NoopAnalyticsAdapter,
  PassthroughImageProvider,
  type AppServices,
} from '@precision-calm/adapters';
import { ReferenceServerStateService } from './serverState';

/** Reference-only deterministic services. Production apps replace these adapters. */
export interface ReferenceServices extends AppServices {
  serverStateLab: ReferenceServerStateService;
}

export const services: ReferenceServices = {
  auth: new MemoryAuthAdapter({ user: { id: 'reference-user', email: 'reference@example.com', displayName: 'Reference User' } }),
  authorization: new MemoryAuthorizationAdapter({ 'reference-user': ['reports.view', 'rewards.optimize', 'settings.manage'] }),
  storage: new MemoryKeyValueStorage(),
  analytics: new NoopAnalyticsAdapter(),
  images: new PassthroughImageProvider(),
  serverStateLab: new ReferenceServerStateService(),
};
