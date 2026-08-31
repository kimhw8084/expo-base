import { createContext, useContext, type PropsWithChildren } from 'react';
import type { PrecisionLinkingRuntime } from '@precision-calm/linking';

const PrecisionLinkingContext = createContext<PrecisionLinkingRuntime | null>(null);

export function PrecisionLinkingProvider({ linking, children }: PropsWithChildren<{ linking: PrecisionLinkingRuntime }>) {
  return <PrecisionLinkingContext.Provider value={linking}>{children}</PrecisionLinkingContext.Provider>;
}

export function usePrecisionLinking(): PrecisionLinkingRuntime {
  const linking = useContext(PrecisionLinkingContext);
  if (!linking) throw new Error('usePrecisionLinking requires PrecisionRuntimeProvider with a linking prop.');
  return linking;
}
