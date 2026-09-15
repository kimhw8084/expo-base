import { createContext, useContext, type PropsWithChildren } from 'react';
import type { ExpoBaseCapabilityRegistry } from './contracts';

const ExpoBaseCapabilitiesContext = createContext<ExpoBaseCapabilityRegistry>({});

/** Root-owned registry for explicitly selected optional capability adapters. */
export function ExpoBaseCapabilitiesProvider({ capabilities = {}, children }: PropsWithChildren<{ capabilities?: ExpoBaseCapabilityRegistry | undefined }>) {
  return <ExpoBaseCapabilitiesContext.Provider value={capabilities}>{children}</ExpoBaseCapabilitiesContext.Provider>;
}

export function useOptionalExpoBaseCapability<T>(key: string): T | null {
  return (useContext(ExpoBaseCapabilitiesContext)[key] as T | undefined) ?? null;
}

export function useExpoBaseCapability<T>(key: string): T {
  const capability = useOptionalExpoBaseCapability<T>(key);
  if (!capability) throw new Error(`Expo Base capability "${key}" is not registered. Add its optional package and register it at the application root.`);
  return capability;
}
