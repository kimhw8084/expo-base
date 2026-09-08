import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

export interface PrecisionMotionValue {
  reducedMotion: boolean;
}

const PrecisionMotionContext = createContext<PrecisionMotionValue>({ reducedMotion: false });

export function MotionRootProvider({ children, reducedMotion }: PropsWithChildren<{ reducedMotion?: boolean }>) {
  const systemReducedMotion = useReducedMotion();
  const value = useMemo(() => ({ reducedMotion: reducedMotion ?? systemReducedMotion }), [reducedMotion, systemReducedMotion]);
  return <PrecisionMotionContext.Provider value={value}>{children}</PrecisionMotionContext.Provider>;
}

export function usePrecisionMotion(): PrecisionMotionValue {
  return useContext(PrecisionMotionContext);
}
