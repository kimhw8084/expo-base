import { createContext, useContext, type PropsWithChildren } from 'react';
import type { ExpoBaseLinkingRuntime } from '@expo-base/linking';

const ExpoBaseLinkingContext = createContext<ExpoBaseLinkingRuntime | null>(null);

export function ExpoBaseLinkingProvider({ linking, children }: PropsWithChildren<{ linking: ExpoBaseLinkingRuntime }>) {
  return <ExpoBaseLinkingContext.Provider value={linking}>{children}</ExpoBaseLinkingContext.Provider>;
}

export function useExpoBaseLinking(): ExpoBaseLinkingRuntime {
  const linking = useContext(ExpoBaseLinkingContext);
  if (!linking) throw new Error('useExpoBaseLinking requires ExpoBaseRuntimeProvider with a linking prop.');
  return linking;
}
