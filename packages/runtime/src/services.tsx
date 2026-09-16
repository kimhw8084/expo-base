import { createContext, useContext, type PropsWithChildren } from 'react';
import type { AppServices } from '@expo-base/adapters';

const ExpoBaseServicesContext = createContext<AppServices | null>(null);

export function ExpoBaseServicesProvider({ services, children }: PropsWithChildren<{ services: AppServices }>) {
  return <ExpoBaseServicesContext.Provider value={services}>{children}</ExpoBaseServicesContext.Provider>;
}

export function useExpoBaseServices<TServices extends AppServices = AppServices>(): TServices {
  const services = useContext(ExpoBaseServicesContext);
  if (!services) throw new Error('useExpoBaseServices requires ExpoBaseServicesProvider or ExpoBaseRuntimeProvider with a services prop.');
  return services as TServices;
}
