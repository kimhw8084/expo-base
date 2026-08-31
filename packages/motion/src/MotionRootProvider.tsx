import type { PropsWithChildren } from 'react';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
export function MotionRootProvider({children}:PropsWithChildren){return <><ReducedMotionConfig mode={ReduceMotion.System}/>{children}</>}
