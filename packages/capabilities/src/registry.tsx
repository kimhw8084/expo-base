import { createContext, useContext, type PropsWithChildren } from 'react';
import type { PrecisionCapabilityRegistry } from './contracts';

const PrecisionCapabilitiesContext = createContext<PrecisionCapabilityRegistry>({});

/** Root-owned registry for explicitly selected optional capability adapters. */
export function PrecisionCapabilitiesProvider({ capabilities = {}, children }: PropsWithChildren<{ capabilities?: PrecisionCapabilityRegistry | undefined }>) {
  return <PrecisionCapabilitiesContext.Provider value={capabilities}>{children}</PrecisionCapabilitiesContext.Provider>;
}

export function useOptionalPrecisionCapability<T>(key: string): T | null {
  return (useContext(PrecisionCapabilitiesContext)[key] as T | undefined) ?? null;
}

export function usePrecisionCapability<T>(key: string): T {
  const capability = useOptionalPrecisionCapability<T>(key);
  if (!capability) throw new Error(`Precision capability "${key}" is not registered. Add its optional package and register it at the application root.`);
  return capability;
}
