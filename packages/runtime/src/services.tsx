import { createContext, useContext, type PropsWithChildren } from 'react';
import type { AppServices } from '@precision-calm/adapters';

const PrecisionServicesContext = createContext<AppServices | null>(null);

export function PrecisionServicesProvider({ services, children }: PropsWithChildren<{ services: AppServices }>) {
  return <PrecisionServicesContext.Provider value={services}>{children}</PrecisionServicesContext.Provider>;
}

export function usePrecisionServices(): AppServices {
  const services = useContext(PrecisionServicesContext);
  if (!services) throw new Error('usePrecisionServices requires PrecisionServicesProvider or PrecisionRuntimeProvider with a services prop.');
  return services;
}
