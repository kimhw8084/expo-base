import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

export interface ExpoBaseMotionValue {
  reducedMotion: boolean;
}

const ExpoBaseMotionContext = createContext<ExpoBaseMotionValue>({ reducedMotion: false });

export function MotionRootProvider({ children, reducedMotion }: PropsWithChildren<{ reducedMotion?: boolean }>) {
  const systemReducedMotion = useReducedMotion();
  const value = useMemo(() => ({ reducedMotion: reducedMotion ?? systemReducedMotion }), [reducedMotion, systemReducedMotion]);
  return <ExpoBaseMotionContext.Provider value={value}>{children}</ExpoBaseMotionContext.Provider>;
}

export function useExpoBaseMotion(): ExpoBaseMotionValue {
  return useContext(ExpoBaseMotionContext);
}
