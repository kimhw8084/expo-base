import type { PropsWithChildren } from 'react';
import Animated, { FadeIn, FadeOut, ReduceMotion, SlideInDown, SlideOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';
import { usePrecisionReducedMotion } from './usePrecisionReducedMotion';

export type RevealKind = 'fade' | 'slide' | 'scale';

export function Reveal({ children, kind = 'fade' }: PropsWithChildren<{ kind?: RevealKind | undefined }>) {
  const { theme } = useUnistyles();
  const reducedMotion = usePrecisionReducedMotion();
  const reduceMotion = reducedMotion ? ReduceMotion.Always : ReduceMotion.System;
  const entering = kind === 'slide'
    ? SlideInDown.duration(theme.motion.duration.normal).reduceMotion(reduceMotion)
    : kind === 'scale'
      ? ZoomIn.duration(theme.motion.duration.normal).reduceMotion(reduceMotion)
      : FadeIn.duration(theme.motion.duration.normal).reduceMotion(reduceMotion);
  const exiting = kind === 'slide'
    ? SlideOutDown.duration(theme.motion.duration.fast).reduceMotion(reduceMotion)
    : kind === 'scale'
      ? ZoomOut.duration(theme.motion.duration.fast).reduceMotion(reduceMotion)
      : FadeOut.duration(theme.motion.duration.fast).reduceMotion(reduceMotion);
  return <Animated.View entering={entering} exiting={exiting}>{children}</Animated.View>;
}
