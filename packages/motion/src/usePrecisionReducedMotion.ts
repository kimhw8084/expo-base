import { usePrecisionMotion } from './MotionRootProvider';

export function usePrecisionReducedMotion() {
  return usePrecisionMotion().reducedMotion;
}
