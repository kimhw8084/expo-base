import { useExpoBaseMotion } from './MotionRootProvider';

export function useExpoBaseReducedMotion() {
  return useExpoBaseMotion().reducedMotion;
}
